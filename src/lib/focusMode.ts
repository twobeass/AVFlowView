/**
 * Focus Mode Utilities
 * Handles k-depth neighborhood calculation and graph filtering
 */

export interface Edge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface Node {
  id: string;
  parentId?: string;
  type: string;
  [key: string]: any;
}

/**
 * Calculate k-depth neighborhood using Breadth-First Search (BFS)
 * Tracks depth for incoming and outgoing edges independently from the start node
 * @param startNodeId - Node to start the search from
 * @param depthOutgoing - Number of hops to include for outgoing edges
 * @param depthIncoming - Number of hops to include for incoming edges
 * @param edges - All edges in the graph
 * @param followOutgoing - Whether to follow outgoing edges (source -> target)
 * @param followIncoming - Whether to follow incoming edges (target -> source)
 * @returns Set of node IDs within the k-depth neighborhood
 */
export function calculateNeighborhood(
  startNodeId: string,
  depthOutgoing: number,
  depthIncoming: number,
  edges: Edge[],
  followOutgoing: boolean,
  followIncoming: boolean
): Set<string> {
  const neighborhood = new Set<string>();
  
  // Perform separate BFS for outgoing and incoming edges
  // Track: nodeId -> set of distances it can be reached at
  const nodeDepthsOutgoing = new Map<string, number>();
  const nodeDepthsIncoming = new Map<string, number>();
  
  // BFS for outgoing edges
  if (followOutgoing) {
    const queueOut: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];
    nodeDepthsOutgoing.set(startNodeId, 0);
    
    while (queueOut.length > 0) {
      const { nodeId, depth } = queueOut.shift()!;
      
      if (depth >= depthOutgoing) continue;
      
      edges.forEach((edge) => {
        if (edge.source === nodeId) {
          const nextNodeId = edge.target;
          const nextDepth = depth + 1;
          
          if (!nodeDepthsOutgoing.has(nextNodeId) || nodeDepthsOutgoing.get(nextNodeId)! > nextDepth) {
            nodeDepthsOutgoing.set(nextNodeId, nextDepth);
            queueOut.push({ nodeId: nextNodeId, depth: nextDepth });
          }
        }
      });
    }
  }
  
  // BFS for incoming edges
  if (followIncoming) {
    const queueIn: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];
    nodeDepthsIncoming.set(startNodeId, 0);
    
    while (queueIn.length > 0) {
      const { nodeId, depth } = queueIn.shift()!;
      
      if (depth >= depthIncoming) continue;
      
      edges.forEach((edge) => {
        if (edge.target === nodeId) {
          const nextNodeId = edge.source;
          const nextDepth = depth + 1;
          
          if (!nodeDepthsIncoming.has(nextNodeId) || nodeDepthsIncoming.get(nextNodeId)! > nextDepth) {
            nodeDepthsIncoming.set(nextNodeId, nextDepth);
            queueIn.push({ nodeId: nextNodeId, depth: nextDepth });
          }
        }
      });
    }
  }
  
  // Merge results: include node if reachable via either direction within depth limits
  neighborhood.add(startNodeId);
  nodeDepthsOutgoing.forEach((depth, nodeId) => {
    if (depth <= depthOutgoing) {
      neighborhood.add(nodeId);
    }
  });
  nodeDepthsIncoming.forEach((depth, nodeId) => {
    if (depth <= depthIncoming) {
      neighborhood.add(nodeId);
    }
  });
  
  return neighborhood;
}

/**
 * Get all parent area IDs for a set of nodes
 * @param nodeIds - Set of node IDs
 * @param nodes - All nodes in the graph
 * @returns Set of parent area IDs
 */
function getParentAreas(nodeIds: Set<string>, nodes: Node[]): Set<string> {
  const parentAreas = new Set<string>();

  nodeIds.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && node.parentId) {
      parentAreas.add(node.parentId);
    }
  });

  return parentAreas;
}

/**
 * Filter edges to only include those connecting visible nodes
 * @param edges - All edges in the graph
 * @param visibleNodeIds - Set of visible node IDs
 * @returns Filtered edges array
 */
function filterEdges(edges: Edge[], visibleNodeIds: Set<string>): Edge[] {
  return edges.filter(
    (edge) =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );
}

/**
 * Create a filtered graph containing only neighborhood nodes and areas
 * Only includes parent areas that have at least one child in the neighborhood
 * @param allNodes - All nodes in the graph
 * @param allEdges - All edges in the graph
 * @param neighborhoodNodeIds - Set of nodes in the neighborhood
 * @returns Object with filtered nodes and edges
 */
export function filterGraphByNeighborhood(
  allNodes: Node[],
  allEdges: Edge[],
  neighborhoodNodeIds: Set<string>
): {
  nodes: Node[];
  edges: Edge[];
  parentAreas: Set<string>;
} {
  // Get parent areas for neighborhood nodes
  const parentAreas = getParentAreas(neighborhoodNodeIds, allNodes);

  // Filter parent areas to only include non-empty ones
  // An area is empty if it has no children in the neighborhood
  const nonEmptyAreas = new Set<string>();
  
  parentAreas.forEach((areaId) => {
    const hasChildrenInNeighborhood = allNodes.some(
      (node) =>
        node.parentId === areaId && neighborhoodNodeIds.has(node.id)
    );
    
    if (hasChildrenInNeighborhood) {
      nonEmptyAreas.add(areaId);
    }
  });

  // Combine neighborhood nodes with non-empty parent areas
  const visibleNodeIds = new Set([...neighborhoodNodeIds, ...nonEmptyAreas]);

  // Filter nodes
  const visibleNodes = allNodes.filter((node) =>
    visibleNodeIds.has(node.id)
  );

  // Filter edges
  const visibleEdges = filterEdges(allEdges, visibleNodeIds);

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
    parentAreas: nonEmptyAreas,
  };
}

/**
 * Check if a node is a device node (can be focused)
 * @param node - Node to check
 * @returns True if node is a device node
 */
export function isDeviceNode(node: Node): boolean {
  return node.type === 'deviceNode';
}

/**
 * Get node label for display
 * @param node - Node object
 * @returns Display label
 */
export function getNodeLabel(node: Node): string {
  return node.data?.label || node.id;
}
