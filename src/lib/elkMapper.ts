import ELK from 'elkjs/lib/elk.bundled.js';

const NODE_WIDTH = 440;
const NODE_HEIGHT = 100;
const PORT_HEIGHT_SPACING = 20;

const elk = new ELK();

function buildAreaTree(areas: any) {
  const idMap: any = {};
  areas.forEach((area: any) => idMap[area.id] = { ...area, children: [] });
  Object.values(idMap).forEach((area: any) => {
    if ((area as any).parentId && (idMap as any)[(area as any).parentId]) {
      (idMap as any)[(area as any).parentId].children.push(area);
    }
  });
  return Object.values(idMap).filter((a: any) => !(a as any).parentId);
}

function injectNodesIntoAreas(area: any, nodes: any, isHorizontal: any, allEdges: any) {
  const childAreas = area.children.map((child: any) => injectNodesIntoAreas(child, nodes, isHorizontal, allEdges));
  const nodeChildren = nodes.filter((n: any) => n.areaId === area.id).map((n: any) => createElkNode(n, isHorizontal, allEdges));
  const allChildren = [...childAreas, ...nodeChildren];
  const areaObj = {
    id: area.id,
    label: area.label,
    layoutOptions: {
      'elk.padding': '[top=50,left=30,bottom=30,right=30]'
    }
  };
  if (allChildren.length > 0) {
    (areaObj as any).children = allChildren;
  }
  return areaObj;
}

export async function layoutGraph(graphData: any, direction = 'LR'): Promise<any> {
  const isHorizontal = direction === 'LR';
  const areas = Array.isArray(graphData.areas) ? graphData.areas : [];
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData.edges) ? graphData.edges : [];
  const areaRoots = buildAreaTree(areas).map(rootArea => injectNodesIntoAreas(rootArea, nodes, isHorizontal, edges));
  const standaloneNodes = nodes
    .filter((n: any) => !n.areaId)
    .map((n: any) => createElkNode(n, isHorizontal, edges));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '100',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.layered.spacing.edgeNodeBetweenLayers': '50',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=30,left=30,bottom=30,right=30]',
    },
    children: [
      ...areaRoots,
      ...standaloneNodes
    ],
    edges: mapEdgesToElk(edges)
  };

  // ---
  // 1st: Run ELK layout
  const elkLayout = await elk.layout(elkGraph);

  // 2nd: Post-process & re-assign bidirectional port sides based on layout
  const nodePos: any = {};
  function collectPositions(elkNode: any) {
    nodePos[elkNode.id] = elkNode;
    if (elkNode.children) elkNode.children.forEach(collectPositions);
  }
  (elkLayout.children || []).forEach(collectPositions);

  function getPortSideDynamic(nodeId: any, portKey: any, isHorizontal: any) {
    let edgesForPort = (graphData.edges || []).filter((e: any) =>
      (e.source === nodeId && e.sourcePortKey === portKey) ||
      (e.target === nodeId && e.targetPortKey === portKey)
    );
    let node = nodePos[nodeId];
    if (!node || !edgesForPort.length) return isHorizontal ? 'EAST' : 'SOUTH';
    
    if (isHorizontal) {
      // LR layout: ONLY allow EAST or WEST, never NORTH or SOUTH
      // For SOURCE ports: face the target's direction
      // For TARGET ports: face the source's direction
      let totalDx = 0;
      edgesForPort.forEach((e: any) => {
        const isSource = e.source === nodeId;
        const otherId = isSource ? e.target : e.source;
        const other = nodePos[otherId];
        if (other) {
          const dx = other.x - node.x;
          // For source ports, positive dx means target is right, so use dx as-is
          // For target ports, positive dx means source is right, so we need to invert to face it
          const direction = isSource ? dx : -dx;
          totalDx += direction;
        }
      });
      return totalDx > 0 ? 'EAST' : 'WEST';
    } else {
      // TB layout: ONLY allow SOUTH or NORTH, never EAST or WEST
      // Sum up the y-positions of all neighbors
      let totalDy = 0;
      edgesForPort.forEach((e: any) => {
        const otherId = e.source === nodeId ? e.target : e.source;
        const other = nodePos[otherId];
        if (other) {
          totalDy += (other.y - node.y);
        }
      });
      // If neighbors are more below (dy > 0), port faces TOP (NORTH)
      // If neighbors are more above (dy < 0), port faces BOTTOM (SOUTH)
      return totalDy > 0 ? 'NORTH' : 'SOUTH';
    }
  }  // Traverse all nodes and update bidirectional port sides
  function walkAndFixPorts(elkNode: any) {
    if (elkNode.ports) {
      elkNode.ports.forEach((port: any) => {
        if (port.properties && port.properties.side && port.properties.side.startsWith('BI_')) {
          const portKey = port.properties.portKey;
          const newSide = getPortSideDynamic(elkNode.id, portKey, isHorizontal);
          port.properties.side = newSide;
        }
      });
    }
    // Recursively traverse children (including nested areas and devices)
    if (elkNode.children) {
      elkNode.children.forEach((child: any) => walkAndFixPorts(child));
    }
  }
  (elkLayout.children || []).forEach(walkAndFixPorts);
  
  // Build a clean map of resolved port sides (nodeId -> portKey -> side)
  const portSidesMap: any = {};
  function buildPortSidesMap(elkNode: any) {
    if (elkNode.ports) {
      portSidesMap[elkNode.id] = {};
      elkNode.ports.forEach((port: any) => {
        const portKey = port.properties?.portKey;
        const side = port.properties?.side;
        if (portKey && side) {
          portSidesMap[elkNode.id][portKey] = side;
        }
      });
    }
    if (elkNode.children) {
      elkNode.children.forEach((child: any) => buildPortSidesMap(child));
    }
  }
  
  (elkLayout.children || []).forEach(buildPortSidesMap);
  
  // Attach port sides map to the layout for later retrieval
  (elkLayout as any).__portSides = portSidesMap;
  // ---
  return elkLayout;
}

function createElkNode(node: any, isHorizontal: any, _allEdges: any) {
  const ports = Object.entries(node.ports).map(([key, port]) => ({
    id: `${node.id}.${key}`,
    properties: {
      side: (port as any).alignment === 'In'
        ? (isHorizontal ? 'WEST' : 'NORTH')
        : (port as any).alignment === 'Out'
          ? (isHorizontal ? 'EAST' : 'SOUTH')
          : `BI_${key}`,
      portKey: key
    }
  }));
  
  const portCount = Object.keys(node.ports || {}).length;
  
  return {
    id: node.id,
    label: node.label,
    width: NODE_WIDTH,
    height: NODE_HEIGHT + (portCount * PORT_HEIGHT_SPACING),
    targetPosition: isHorizontal ? 'left' : 'top',
    sourcePosition: isHorizontal ? 'right' : 'bottom',
    ports
  };
}

function mapEdgesToElk(edges: any) {
  return Array.isArray(edges) ? edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
    properties: {
      sourcePort: e.sourcePortKey ? `${e.source}.${e.sourcePortKey}` : undefined,
      targetPort: e.targetPortKey ? `${e.target}.${e.targetPortKey}` : undefined,
      binding: e.binding || undefined
    }
  })) : [];
}
