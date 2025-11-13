import ELK from 'elkjs/lib/elk.bundled.js';

// Better base sizing for readability, dynamic height per port count
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
  return await elk.layout(elkGraph);
}

function createElkNode(node, isHorizontal, allEdges) {
  function dynamicBidirectionalSide(nodeId, portKey) {
    // Assign left (WEST) or right (EAST) for LR, based on edge direction (if any)
    if (!allEdges) return isHorizontal ? 'EAST' : 'SOUTH';
    let outRight = 0, outLeft = 0;
    allEdges.forEach(edge => {
      if (edge.source === nodeId && edge.sourcePortKey === portKey) outRight++;
      if (edge.target === nodeId && edge.targetPortKey === portKey) outLeft++;
    });
    if (outLeft === 0 && outRight === 0) return isHorizontal ? 'EAST' : 'SOUTH';
    return outRight >= outLeft ? (isHorizontal ? 'EAST' : 'SOUTH') : (isHorizontal ? 'WEST' : 'NORTH');
  }

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
            : dynamicBidirectionalSide(node.id, key),
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
