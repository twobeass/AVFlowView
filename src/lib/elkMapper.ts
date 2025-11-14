import ELK from 'elkjs/lib/elk.bundled.js';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 88;

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

function injectNodesIntoAreas(area: any, nodes: any, isHorizontal: any) {
  const childAreas = area.children.map((child: any) => injectNodesIntoAreas(child, nodes, isHorizontal));
  const nodeChildren = nodes.filter((n: any) => n.areaId === area.id).map((n: any) => createElkNode(n, isHorizontal));
  const allChildren = [...childAreas, ...nodeChildren];
  const areaObj = {
    id: area.id,
    label: area.label,
    layoutOptions: {
      'elk.padding': '[top=80,left=80,bottom=80,right=80]',
      'elk.spacing.nodeNode': '200',
      'elk.layered.spacing.nodeNodeBetweenLayers': '250',
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.aspectRatio': '1.5',
      'elk.nodeSize.constraints': 'MINIMUM_SIZE',
      'elk.nodeSize.options': 'DEFAULT_MINIMUM_SIZE'
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
  
  const areaRoots = buildAreaTree(areas).map(rootArea => injectNodesIntoAreas(rootArea, nodes, isHorizontal));
  const standaloneNodes = nodes
    .filter((n: any) => !n.areaId)
    .map((n: any) => createElkNode(n, isHorizontal));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
      'elk.spacing.nodeNode': '200',
      'elk.layered.spacing.nodeNodeBetweenLayers': '250',
      'elk.layered.spacing.edgeNodeBetweenLayers': '100',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '50',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=60,left=60,bottom=60,right=60]',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      'elk.separateConnectedComponents': 'true',
      'elk.spacing.componentComponent': '150',
      'elk.layered.considerModelOrder.strategy': 'NONE'
    },
    children: [
      ...areaRoots,
      ...standaloneNodes
    ],
    edges: mapEdgesToElk(edges)
  };

  const elkLayout = await elk.layout(elkGraph);
  return elkLayout;
}

function createElkNode(node: any, isHorizontal: any) {
  const ports = Object.entries(node.ports).map(([key, port]) => ({
    id: `${node.id}.${key}`,
    properties: {
      side: (port as any).alignment === 'In'
        ? (isHorizontal ? 'WEST' : 'NORTH')
        : (isHorizontal ? 'EAST' : 'SOUTH'),
      portKey: key
    }
  }));
  
  return {
    id: node.id,
    label: node.label,
    width: NODE_WIDTH,
    height: NODE_HEIGHT + (Object.keys(node.ports || {}).length * 11),
    targetPosition: isHorizontal ? 'left' : 'top',
    sourcePosition: isHorizontal ? 'right' : 'bottom',
    ports
  };
}

function mapEdgesToElk(edges: any) {
  return Array.isArray(edges) ? edges.map(e => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target]
  })) : [];
}
