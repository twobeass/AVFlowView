import ELK from 'elkjs/lib/elk.bundled.js';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const AREA_WIDTH = 220;
const AREA_HEIGHT = 60;

const elk = new ELK();

export async function layoutGraph(graphData, direction = 'LR') {
  const isHorizontal = direction === 'LR';
  
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
    },
    children: mapNodesToElk(graphData.nodes, graphData.areas, isHorizontal),
    edges: mapEdgesToElk(graphData.edges)
  };
  
  return await elk.layout(elkGraph);
}

function mapNodesToElk(nodes, areas, isHorizontal) {
  // Ensure areas are visible and assigned dimensions
  const areaNodes = areas.map(area => ({
    id: area.id,
    width: AREA_WIDTH,
    height: AREA_HEIGHT,
    label: area.label,
    layoutOptions: { 
      'elk.padding': '[top=24,left=16,bottom=16,right=16]'
    },
    children: nodes
      .filter(n => n.areaId === area.id)
      .map(n => createElkNode(n, isHorizontal))
  }));
  const standaloneNodes = nodes
    .filter(n => !n.areaId)
    .map(n => createElkNode(n, isHorizontal));
    
  return [...areaNodes, ...standaloneNodes];
}

function createElkNode(node, isHorizontal) {
  return {
    id: node.id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    targetPosition: isHorizontal ? 'left' : 'top',
    sourcePosition: isHorizontal ? 'right' : 'bottom',
    label: node.label,
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
  return edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target]
  }));
}
