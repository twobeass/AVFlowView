import ELK from 'elkjs/lib/elk.bundled.js';

// Node dimensions matching DeviceNode styling
const NODE_WIDTH = 440;
const BASE_NODE_HEIGHT = 100;
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

function injectNodesIntoAreas(area: any, nodes: any, isHorizontal: any, simplifiedMode: any = false) {
  const childAreas = area.children.map((child: any) => injectNodesIntoAreas(child, nodes, isHorizontal, simplifiedMode));
  const nodeChildren = nodes.filter((n: any) => n.areaId === area.id).map((n: any) => createElkNode(n, isHorizontal, simplifiedMode));
  const allChildren = [...childAreas, ...nodeChildren];
  const areaObj = {
    id: area.id,
    label: area.label,
    layoutOptions: {
      // Extra top padding for area labels
      'elk.padding': '[top=50,left=30,bottom=30,right=30]',
      'elk.spacing.nodeNode': '100',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
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

export async function layoutGraph(graphData: any, direction = 'LR', simplifiedMode = false): Promise<any> {
  const isHorizontal = direction === 'LR';
  const areas = Array.isArray(graphData.areas) ? graphData.areas : [];
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData.edges) ? graphData.edges : [];
  
  const areaRoots = buildAreaTree(areas).map(rootArea => injectNodesIntoAreas(rootArea, nodes, isHorizontal, simplifiedMode));
  const standaloneNodes = nodes
    .filter((n: any) => !n.areaId)
    .map((n: any) => createElkNode(n, isHorizontal, simplifiedMode));

  // Optimized spacing for simplified mode
  const layoutOptions: any = simplifiedMode ? {
    'elk.algorithm': 'layered',
    'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
    'elk.spacing.nodeNode': '60',
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.layered.spacing.edgeNodeBetweenLayers': '40',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '30',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.padding': '[top=30,left=30,bottom=30,right=30]',
    'elk.layered.nodePlacement.strategy': 'SIMPLE',
    'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
    'elk.separateConnectedComponents': 'true',
    'elk.spacing.componentComponent': '100',
    'elk.layered.considerModelOrder.strategy': 'NONE',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP'
  } : {
    'elk.algorithm': 'layered',
    'elk.direction': isHorizontal ? 'RIGHT' : 'DOWN',
    'elk.spacing.nodeNode': '100',
    'elk.layered.spacing.nodeNodeBetweenLayers': '150',
    'elk.layered.spacing.edgeNodeBetweenLayers': '50',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '50',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.padding': '[top=30,left=30,bottom=30,right=30]',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
    'elk.separateConnectedComponents': 'true',
    'elk.spacing.componentComponent': '150',
    'elk.layered.considerModelOrder.strategy': 'NONE'
  };

  const elkGraph = {
    id: 'root',
    layoutOptions,
    children: [
      ...areaRoots,
      ...standaloneNodes
    ],
    edges: mapEdgesToElk(edges)
  };

  const elkLayout = await elk.layout(elkGraph);
  return elkLayout;
}

function createElkNode(node: any, isHorizontal: any, simplifiedMode: any = false) {
  // Simplified mode: uniform size, no ports
  if (simplifiedMode) {
    return {
      id: node.id,
      label: node.label,
      width: 200,
      height: 80,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      ports: [] // No ports in simplified mode
    };
  }
  
  // Detailed mode: variable size based on ports
  const portCount = Object.keys(node.ports || {}).length;
  const nodeHeight = BASE_NODE_HEIGHT + (portCount * PORT_HEIGHT_SPACING);
  
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
    height: nodeHeight,
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
