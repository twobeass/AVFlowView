import { useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, useReactFlow } from '@xyflow/react';
import { layoutGraph } from '../lib/elkMapper';
import { validateGraph } from '../lib/validator';
import DeviceNode from './nodes/DeviceNode';
import GroupNode from './nodes/GroupNode';
import SmartEdge from './edges/SmartEdge';
import FocusModePanel from './FocusModePanel';

import { edgeCategoryColors } from '../config/colors';
import { calculateNeighborhood, filterGraphByNeighborhood } from '../lib/focusMode';

const nodeTypes = {
  deviceNode: DeviceNode,
  groupNode: GroupNode,
};
const edgeTypes = {
  smart: SmartEdge,
};

// Category-based edge colors
function getEdgeCategoryColor(category: string) {
  return edgeCategoryColors[category as keyof typeof edgeCategoryColors] || edgeCategoryColors.Default;
}

function mapEdgesToReactFlow(elkEdges: any, originalEdges: any) {
  return elkEdges.map((elkEdge: any) => {
    const original = originalEdges.find((e: any) => e.id === elkEdge.id);
    const edgeColor = getEdgeCategoryColor(original?.category || '');
    
    return {
      id: elkEdge.id,
      source: elkEdge.sources[0] || original?.source || '',
      target: elkEdge.targets[0] || original?.target || '',
      label: original?.label || '',
      animated: false,
      style: { 
        stroke: edgeColor, 
        strokeWidth: 2.5,
      },
      type: 'smoothstep', // Use smoothstep for nice curved routing
      // When edges specify port keys, attach to specific handles so edges snap to them
      sourceHandle: original?.sourcePortKey || undefined,
      targetHandle: original?.targetPortKey || undefined
    };
  });
}

function flattenElkGroups(elkNode: any, graphData: any, _parent: any = null) {
  // Recursively flatten ELK to React Flow nodes, group devices by parentId
  const nodes = [];
  const isArea = graphData.areas.some((a: any) => a.id === elkNode.id);
  if(isArea) {
    nodes.push({
      id: elkNode.id,
      type: 'groupNode',
      parentId: elkNode.parent || undefined,
      position: { x: elkNode.x, y: elkNode.y },
      extent: undefined, // Remove extent constraint so children can be dragged freely
      draggable: !elkNode.parent, // only allow top-level areas to move
      style: {
        width: elkNode.width || 400,
        height: elkNode.height || 300,
        minWidth: 300,
        minHeight: 200,
      },
      data: { label: elkNode.label || elkNode.id },
      selectable: true,
      expandParent: true, // Enable auto-expansion when children are dragged
    });
  } else if(graphData.nodes.some((n: any) => n.id === elkNode.id)) {
    // normal device
    const d = graphData.nodes.find((n: any) => n.id === elkNode.id);
    nodes.push({
      id: elkNode.id,
      type: 'deviceNode',
      parentId: elkNode.parent || undefined,
      position: { x: elkNode.x, y: elkNode.y },
      data: d,
      zIndex: 2,
      extent: elkNode.parent ? 'parent' : undefined,
    });
  }
  if (elkNode.children) {
    elkNode.children.forEach((child: any) => {
      child.parent = elkNode.id;
      nodes.push(...flattenElkGroups(child, graphData, elkNode.id));
    });
  }
  return nodes;
}

function AVWiringViewer({ graphData }: { graphData: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [direction] = useState('LR');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  
  // Focus mode state
  const [focusMode, setFocusMode] = useState({
    enabled: false,
    focusedNodeId: null as string | null,
    depthOutgoing: 2,
    depthIncoming: 2,
    followOutgoing: true,
    followIncoming: true,
  });
  
  // Store full graph data for filtering
  const [fullGraphData, setFullGraphData] = useState<any>(null);
  const [fullNodes, setFullNodes] = useState<any[]>([]);
  const [fullEdges, setFullEdges] = useState<any[]>([]);

  useEffect(() => {
    const validation = validateGraph(graphData);
    if (!validation.valid) {
      setValidationErrors(validation.errors || []);
      return;
    }

    layoutGraph(graphData, direction).then(layouted => {
      let rfNodes: any[] = [];
      (layouted.children || []).forEach((root: any) => {
        rfNodes.push(...flattenElkGroups(root, graphData, null));
      });
      
      const rfEdges = mapEdgesToReactFlow(layouted.edges || [], graphData.edges || []);
      
      // Store full graph data
      setFullGraphData(graphData);
      setFullNodes(rfNodes);
      setFullEdges(rfEdges);
      
      // Exit focus mode when graph changes
      setFocusMode({
        enabled: false,
        focusedNodeId: null,
        depthOutgoing: 2,
        depthIncoming: 2,
        followOutgoing: true,
        followIncoming: true,
      });
      
      setNodes(rfNodes);
      setEdges(rfEdges);
      setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 200);
    });
  }, [graphData, direction]);

  // Handle node click for focus mode
  const handleNodeClick = async (_event: any, node: any) => {
    // Only allow focusing on device nodes
    if (node.type !== 'deviceNode') {
      return;
    }

    // Toggle focus: if clicking the same node, exit focus mode
    if (focusMode.enabled && focusMode.focusedNodeId === node.id) {
      setFocusMode({
        enabled: false,
        focusedNodeId: null,
        depthOutgoing: 2,
        depthIncoming: 2,
        followOutgoing: true,
        followIncoming: true,
      });
      setNodes(fullNodes as any);
      setEdges(fullEdges as any);
      setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 200);
      return;
    }

    // Activate focus mode
    if (!fullGraphData) return;

    const neighborhood = calculateNeighborhood(
      node.id,
      focusMode.depthOutgoing,
      focusMode.depthIncoming,
      fullGraphData.edges || [],
      focusMode.followOutgoing,
      focusMode.followIncoming
    );

    const filtered = filterGraphByNeighborhood(
      fullNodes,
      fullEdges,
      neighborhood
    );

    // Re-layout with filtered graph
    const filteredGraphData = {
      ...fullGraphData,
      nodes: fullGraphData.nodes.filter((n: any) =>
        filtered.nodes.some((fn: any) => fn.id === n.id)
      ),
      areas: fullGraphData.areas.filter((a: any) =>
        filtered.parentAreas.has(a.id)
      ),
      edges: fullGraphData.edges.filter((e: any) =>
        filtered.edges.some((fe: any) => fe.id === e.id)
      ),
    };

    try {
      const layouted = await layoutGraph(filteredGraphData, direction);
      let rfNodes: any[] = [];
      (layouted.children || []).forEach((root: any) => {
        rfNodes.push(...flattenElkGroups(root, filteredGraphData, null));
      });

      // Highlight focused node
      rfNodes = rfNodes.map((n: any) => ({
        ...n,
        selected: n.id === node.id,
        style: {
          ...n.style,
          ...(n.id === node.id && {
            boxShadow: '0 0 0 3px #1976d2, 0 2px 8px rgba(0,0,0,0.2)',
            borderWidth: 3,
          }),
        },
      }));

      const rfEdges = mapEdgesToReactFlow(layouted.edges || [], filteredGraphData.edges || []);

      setNodes(rfNodes);
      setEdges(rfEdges);
      
      setFocusMode({
        enabled: true,
        focusedNodeId: node.id,
        depthOutgoing: focusMode.depthOutgoing,
        depthIncoming: focusMode.depthIncoming,
        followOutgoing: focusMode.followOutgoing,
        followIncoming: focusMode.followIncoming,
      });

      setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 200);
    } catch (error) {
      console.error('Error applying focus mode:', error);
    }
  };

  // Update focus mode when depth or direction changes
  const updateFocusMode = async (updates: Partial<typeof focusMode>) => {
    if (!focusMode.enabled || !focusMode.focusedNodeId || !fullGraphData) return;

    const newFocusMode = { ...focusMode, ...updates };
    
    const neighborhood = calculateNeighborhood(
      focusMode.focusedNodeId,
      newFocusMode.depthOutgoing,
      newFocusMode.depthIncoming,
      fullGraphData.edges || [],
      newFocusMode.followOutgoing,
      newFocusMode.followIncoming
    );

    const filtered = filterGraphByNeighborhood(
      fullNodes,
      fullEdges,
      neighborhood
    );

    const filteredGraphData = {
      ...fullGraphData,
      nodes: fullGraphData.nodes.filter((n: any) =>
        filtered.nodes.some((fn: any) => fn.id === n.id)
      ),
      areas: fullGraphData.areas.filter((a: any) =>
        filtered.parentAreas.has(a.id)
      ),
      edges: fullGraphData.edges.filter((e: any) =>
        filtered.edges.some((fe: any) => fe.id === e.id)
      ),
    };

    try {
      const layouted = await layoutGraph(filteredGraphData, direction);
      let rfNodes: any[] = [];
      (layouted.children || []).forEach((root: any) => {
        rfNodes.push(...flattenElkGroups(root, filteredGraphData, null));
      });

      rfNodes = rfNodes.map((n: any) => ({
        ...n,
        selected: n.id === focusMode.focusedNodeId,
        style: {
          ...n.style,
          ...(n.id === focusMode.focusedNodeId && {
            boxShadow: '0 0 0 3px #1976d2, 0 2px 8px rgba(0,0,0,0.2)',
            borderWidth: 3,
          }),
        },
      }));

      const rfEdges = mapEdgesToReactFlow(layouted.edges || [], filteredGraphData.edges || []);

      setNodes(rfNodes);
      setEdges(rfEdges);
      setFocusMode(newFocusMode);

      setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 200);
    } catch (error) {
      console.error('Error updating focus mode:', error);
    }
  };

  const focusedNodeLabel = focusMode.focusedNodeId
    ? fullNodes.find((n) => n.id === focusMode.focusedNodeId)?.data?.label ||
      focusMode.focusedNodeId
    : null;

  const visibleDeviceNodeCount = nodes.filter(
    (n) => n.type === 'deviceNode'
  ).length;
  const totalDeviceNodeCount = fullNodes.filter(
    (n) => n.type === 'deviceNode'
  ).length;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {/* Focus Mode Sidebar */}
      <FocusModePanel
        enabled={focusMode.enabled}
        focusedNodeId={focusMode.focusedNodeId}
        focusedNodeLabel={focusedNodeLabel}
        depthOutgoing={focusMode.depthOutgoing}
        depthIncoming={focusMode.depthIncoming}
        followOutgoing={focusMode.followOutgoing}
        followIncoming={focusMode.followIncoming}
        visibleNodeCount={visibleDeviceNodeCount}
        totalNodeCount={totalDeviceNodeCount}
        onDepthOutgoingChange={(depthOutgoing) => updateFocusMode({ depthOutgoing })}
        onDepthIncomingChange={(depthIncoming) => updateFocusMode({ depthIncoming })}
        onFollowOutgoingChange={(followOutgoing) =>
          updateFocusMode({ followOutgoing })
        }
        onFollowIncomingChange={(followIncoming) =>
          updateFocusMode({ followIncoming })
        }
        onExitFocus={() => {
          setFocusMode({
            enabled: false,
            focusedNodeId: null,
            depthOutgoing: 2,
            depthIncoming: 2,
            followOutgoing: true,
            followIncoming: true,
          });
          setNodes(fullNodes as any);
          setEdges(fullEdges as any);
          setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 200);
        }}
      />

      {/* Main Canvas Area */}
      <div style={{ flex: 1, height: '100vh', overflow: 'hidden' }}>
        {validationErrors.length > 0 && (
          <div style={{ padding: 8, backgroundColor: '#ffcdd2', color: '#b71c1c' }}>
            <h3>Validation Errors</h3>
            <ul>{validationErrors.map((err, i) => <li key={i}>{err.path} - {err.message}</li>)}</ul>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2.5}
          panOnDrag={true}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function AVWiringViewerWrapper(props: any) {
  return (
    <ReactFlowProvider>
      <AVWiringViewer {...props} />
    </ReactFlowProvider>
  );
}
