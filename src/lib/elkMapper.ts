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

function injectNodesIntoAreas(area: any, nodes: any, isHorizontal: any, allEdges: any, nodePriorities?: Map<string, number>) {
  const childAreas = area.children.map((child: any) => injectNodesIntoAreas(child, nodes, isHorizontal, allEdges, nodePriorities));
  
  // Sort nodes by priority before creating ELK nodes
  const areaNodes = nodes.filter((n: any) => n.areaId === area.id);
  areaNodes.sort((a: any, b: any) => {
    const prioA = nodePriorities?.get(a.id) ?? 999;
    const prioB = nodePriorities?.get(b.id) ?? 999;
    return prioA - prioB;
  });
  
  const nodeChildren = areaNodes.map((n: any, idx: number) => createElkNode(n, isHorizontal, allEdges, nodePriorities, idx));
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
  
  // Compute node priorities based on their connection port indices
  const nodePriorities = computeNodePriorities(nodes, edges);
  
  const areaRoots = buildAreaTree(areas).map(rootArea => injectNodesIntoAreas(rootArea, nodes, isHorizontal, edges, nodePriorities));
  const standaloneNodes = nodes
    .filter((n: any) => !n.areaId)
    .map((n: any, idx: number) => createElkNode(n, isHorizontal, edges, nodePriorities, idx));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '100',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.layered.spacing.edgeNodeBetweenLayers': '50',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '30',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=30,left=30,bottom=30,right=30]',
      // Edge crossing minimization - enhanced
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
      'elk.layered.crossingMinimization.semiInteractive': 'true',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.considerModelOrder.portModelOrder': 'true',
      'elk.layered.thoroughness': '15',
      // Node placement and ordering
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      'elk.layered.cycleBreaking.strategy': 'GREEDY',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      // Edge routing to avoid crossings and nodes
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.unnecessaryBendpoints': 'false',
      'elk.layered.nodePlacement.linearSegments.deflectionDampening': '0.3',
      'elk.layered.wrapping.strategy': 'OFF',
      // Merge and simplify edges
      'elk.layered.mergeEdges': 'true',
      'elk.layered.mergeHierarchyEdges': 'true',
      // Port constraints
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.portAlignment.default': 'CENTER',
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

function computeNodePriorities(nodes: any, edges: any): Map<string, number> {
  const priorities = new Map<string, number>();
  
  // For each node, compute an average priority based on the port indices it connects to
  nodes.forEach((node: any) => {
    const outgoingEdges = edges.filter((e: any) => e.source === node.id);
    const incomingEdges = edges.filter((e: any) => e.target === node.id);
    
    let totalPriority = 0;
    let count = 0;
    
    // Consider target port indices for outgoing edges
    outgoingEdges.forEach((edge: any) => {
      if (edge.targetPortKey) {
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        if (targetNode && targetNode.ports) {
          const portKeys = Object.keys(targetNode.ports);
          const portIndex = portKeys.indexOf(edge.targetPortKey);
          if (portIndex >= 0) {
            totalPriority += portIndex;
            count++;
          }
        }
      }
    });
    
    // Consider source port indices for incoming edges
    incomingEdges.forEach((edge: any) => {
      if (edge.sourcePortKey) {
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        if (sourceNode && sourceNode.ports) {
          const portKeys = Object.keys(sourceNode.ports);
          const portIndex = portKeys.indexOf(edge.sourcePortKey);
          if (portIndex >= 0) {
            totalPriority += portIndex;
            count++;
          }
        }
      }
    });
    
    if (count > 0) {
      priorities.set(node.id, totalPriority / count);
    }
  });
  
  return priorities;
}

function createElkNode(node: any, isHorizontal: any, _allEdges: any, nodePriorities?: Map<string, number>, nodeIndex?: number) {
  const portEntries = Object.entries(node.ports);
  
  const ports = portEntries.map(([key, port], index) => ({
    id: `${node.id}.${key}`,
    properties: {
      side: (port as any).alignment === 'In'
        ? (isHorizontal ? 'WEST' : 'NORTH')
        : (port as any).alignment === 'Out'
          ? (isHorizontal ? 'EAST' : 'SOUTH')
          : `BI_${key}`,
      portKey: key,
      'port.index': index,
      'port.side': (port as any).alignment === 'In'
        ? (isHorizontal ? 'WEST' : 'NORTH')
        : (port as any).alignment === 'Out'
          ? (isHorizontal ? 'EAST' : 'SOUTH')
          : 'UNDEFINED'
    }
  }));
  
  const portCount = Object.keys(node.ports || {}).length;
  
  const priority = nodePriorities?.get(node.id);
  
  return {
    id: node.id,
    label: node.label,
    width: NODE_WIDTH,
    height: NODE_HEIGHT + (portCount * PORT_HEIGHT_SPACING),
    targetPosition: isHorizontal ? 'left' : 'top',
    sourcePosition: isHorizontal ? 'right' : 'bottom',
    ports,
    layoutOptions: {
      'elk.portConstraints': 'FIXED_ORDER',
      'elk.priority': priority !== undefined ? Math.round(priority * 10).toString() : undefined,
      'org.eclipse.elk.layered.priority': priority !== undefined ? Math.round(priority * 10).toString() : undefined,
      'org.eclipse.elk.layered.crossingMinimization.positionChoiceConstraint': nodeIndex !== undefined ? nodeIndex.toString() : undefined
    }
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
