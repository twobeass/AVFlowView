import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export async function layoutGraph(graphData, direction = 'LR') {
  const isHorizontal = direction === 'LR';
  
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
    },
    children: mapNodesToElk(graphData.nodes, graphData.areas, isHorizontal),
    edges: mapEdgesToElk(graphData.edges)
  };
  
  return await elk.layout(elkGraph);
}

function mapNodesToElk(nodes, areas, isHorizontal) {
  const areaNodes = areas.map(area => ({
    id: area.id,
    layoutOptions: { 
      'elk.padding': '[top=40,left=24,bottom=24,right=24]' 
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
    width: 200,
    height: 100,
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
  return edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target]
  }));
}
