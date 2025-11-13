import ELK from 'elkjs/lib/elk.bundled.js';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 68;

const elk = new ELK();

function buildAreaTree(areas) {
  // returns a map of areaId to area object with children: []
  const idMap = {};
  areas.forEach(area => idMap[area.id] = { ...area, children: [] });
  // Build heirarchy
  Object.values(idMap).forEach(area => {
    if (area.parentId && idMap[area.parentId]) {
      idMap[area.parentId].children.push(area);
    }
  });
  // Return only root areas
  return Object.values(idMap).filter(a => !a.parentId);
}

function injectNodesIntoAreas(area, nodes, isHorizontal) {
  // Assign only nodes with areaId matching current area
  const children = [
    ...area.children.map(child => injectNodesIntoAreas(child, nodes, isHorizontal)),
    ...nodes.filter(n => n.areaId === area.id).map(n => createElkNode(n, isHorizontal)),
  ];
  return {
    id: area.id,
    label: area.label,
    layoutOptions: {
      'elk.padding': '[top=32,left=16,bottom=24,right=16]'
    },
    children: children.length ? children : undefined,
    width: children.length ? undefined : 180,
    height: children.length ? undefined : 58
  };
}

export async function layoutGraph(graphData, direction = 'LR') {
  const isHorizontal = direction === 'LR';
  const areas = Array.isArray(graphData.areas) ? graphData.areas : [];
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  // Build nested area tree structure (compound graph)
  const areaRoots = buildAreaTree(areas).map(rootArea => injectNodesIntoAreas(rootArea, nodes, isHorizontal));
  // Nodes without area
  const standaloneNodes = nodes
    .filter(n => !n.areaId)
    .map(n => createElkNode(n, isHorizontal));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
    },
    children: [
      ...areaRoots,
      ...standaloneNodes
    ],
    edges: mapEdgesToElk(graphData.edges)
  };
  return await elk.layout(elkGraph);
}

function createElkNode(node, isHorizontal) {
  return {
    id: node.id,
    label: node.label,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    targetPosition: isHorizontal ? 'left' : 'top',
    sourcePosition: isHorizontal ? 'right' : 'bottom',
    ports: Object.entries(node.ports).map(([key, port]) => ({
      id: `${node.id}.${key}`,
      properties: {
        side: getPortSide(port.alignment, isHorizontal),
        portKey: key
      }
    }))
  };
}

function getPortSide(alignment, isHorizontal) {
  if (alignment === 'In') return isHorizontal ? 'WEST' : 'NORTH';
  if (alignment === 'Out') return isHorizontal ? 'EAST' : 'SOUTH';
  return 'SOUTH';
}

function mapEdgesToElk(edges) {
  return Array.isArray(edges) ? edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target]
  })) : [];
}
