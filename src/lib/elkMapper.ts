import ELK from 'elkjs/lib/elk.bundled.js';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 88;

const elk = new ELK();

function buildAreaTree(areas) {
  const idMap = {};
  areas.forEach(area => idMap[area.id] = { ...area, children: [] });
  Object.values(idMap).forEach(area => {
    if (area.parentId && idMap[area.parentId]) {
      idMap[area.parentId].children.push(area);
    }
  });
  return Object.values(idMap).filter(a => !a.parentId);
}

function injectNodesIntoAreas(area, nodes, isHorizontal, allEdges) {
  const childAreas = area.children.map(child => injectNodesIntoAreas(child, nodes, isHorizontal, allEdges));
  const nodeChildren = nodes.filter(n => n.areaId === area.id).map(n => createElkNode(n, isHorizontal, allEdges));
  const allChildren = [...childAreas, ...nodeChildren];
  const areaObj = {
    id: area.id,
    label: area.label,
    layoutOptions: {
      'elk.padding': '[top=40,left=24,bottom=32,right=24]'
    }
  };
  if (allChildren.length > 0) {
    areaObj.children = allChildren;
  }
  return areaObj;
}

export async function layoutGraph(graphData, direction = 'LR') {
  const isHorizontal = direction === 'LR';
  const areas = Array.isArray(graphData.areas) ? graphData.areas : [];
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData.edges) ? graphData.edges : [];
  const areaRoots = buildAreaTree(areas).map(rootArea => injectNodesIntoAreas(rootArea, nodes, isHorizontal, edges));
  const standaloneNodes = nodes
    .filter(n => !n.areaId)
    .map(n => createElkNode(n, isHorizontal, edges));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '85',
      'elk.layered.spacing.nodeNodeBetweenLayers': '130',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
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
  const nodePos = {};
  function collectPositions(elkNode) {
    nodePos[elkNode.id] = elkNode;
    if (elkNode.children) elkNode.children.forEach(collectPositions);
  }
  elkLayout.children.forEach(collectPositions);

  function getPortSideDynamic(nodeId, portKey, isHorizontal) {
    let edgesForPort = (graphData.edges || []).filter(e => 
      (e.source === nodeId && e.sourcePortKey === portKey) ||
      (e.target === nodeId && e.targetPortKey === portKey)
    );
    let node = nodePos[nodeId];
    if (!node || !edgesForPort.length) return isHorizontal ? 'EAST' : 'SOUTH';
    let right = 0, left = 0;
    edgesForPort.forEach(e => {
      let otherId = e.source === nodeId ? e.target : e.source;
      let other = nodePos[otherId];
      if (!other) return;
      if (isHorizontal) {
        if (other.x > node.x) right++; else left++;
      } else {
        if (other.y > node.y) right++; else left++;
      }
    });
    if (right === 0 && left === 0) return isHorizontal ? 'EAST' : 'SOUTH';
    return right >= left ? (isHorizontal ? 'EAST' : 'SOUTH') : (isHorizontal ? 'WEST' : 'NORTH');
  }

  // Traverse all nodes and update bidirectional port sides
  function walkAndFixPorts(elkNode) {
    if (elkNode.ports) {
      elkNode.ports.forEach(port => {
        if (port.properties && port.properties.side && port.properties.side.startsWith('BI_')) {
          port.properties.side = getPortSideDynamic(elkNode.id, port.properties.portKey, isHorizontal);
        }
      });
    }
    if (elkNode.children) elkNode.children.forEach(walkAndFixPorts);
  }
  elkLayout.children.forEach(walkAndFixPorts);
  // ---
  return elkLayout;
}

function createElkNode(node, isHorizontal, allEdges) {
  return {
    id: node.id,
    label: node.label,
    width: NODE_WIDTH,
    height: NODE_HEIGHT + (Object.keys(node.ports || {}).length * 11),
    targetPosition: isHorizontal ? 'left' : 'top',
    sourcePosition: isHorizontal ? 'right' : 'bottom',
    ports: Object.entries(node.ports).map(([key, port]) => ({
      id: `${node.id}.${key}`,
      properties: {
        side: port.alignment === 'In'
          ? (isHorizontal ? 'WEST' : 'NORTH')
          : port.alignment === 'Out'
            ? (isHorizontal ? 'EAST' : 'SOUTH')
            : `BI_${key}`,
        portKey: key
      }
    }))
  };
}

function mapEdgesToElk(edges) {
  return Array.isArray(edges) ? edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target]
  })) : [];
}
