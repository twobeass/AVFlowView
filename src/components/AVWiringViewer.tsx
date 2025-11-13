import { useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, useReactFlow } from '@xyflow/react';
import { layoutGraph } from '../lib/elkMapper';
import { validateGraph } from '../lib/validator';
import DeviceNode from './nodes/DeviceNode';
import GroupNode from './nodes/GroupNode';

const nodeTypes = {
  deviceNode: DeviceNode,
  groupNode: GroupNode,
};
const edgeTypes = {};

function mapEdgesToReactFlow(elkEdges: any, originalEdges: any) {
  return elkEdges.map((elkEdge: any) => {
    const original = originalEdges.find((e: any) => e.id === elkEdge.id);
    return {
      id: elkEdge.id,
      source: elkEdge.sources[0] || original?.source || '',
      target: elkEdge.targets[0] || original?.target || '',
      label: original?.label || '',
      animated: false,
      style: { stroke: '#344', strokeWidth: 2 },
      type: 'default',
      // When edges specify port keys, attach to specific handles so edges snap to them
      sourceHandle: original?.sourcePortKey || undefined,
      targetHandle: original?.targetPortKey || undefined
    };
  });
}

function flattenElkGroups(elkNode: any, graphData: any, _parent: any = null, portSidesMap: any = {}) {
  // Recursively flatten ELK to React Flow nodes, group devices by parentId
  const nodes = [];
  const isArea = graphData.areas.some((a: any) => a.id === elkNode.id);
  if(isArea) {
    nodes.push({
      id: elkNode.id,
      type: 'groupNode',
      parentId: elkNode.parent || undefined,
      position: { x: elkNode.x, y: elkNode.y },
      extent: elkNode.parent ? 'parent' : undefined,
      draggable: !elkNode.parent, // only allow top-level areas to move
      style: {
        width: elkNode.width || 140,
        height: elkNode.height || 70,
      },
      data: { label: elkNode.label || elkNode.id },
      selectable: true,
      expandParent: false,
    });
  } else if(graphData.nodes.some((n: any) => n.id === elkNode.id)) {
    // normal device
    const d = graphData.nodes.find((n: any) => n.id === elkNode.id);
    // Clone node data and merge computed port sides from portSidesMap
    const clonedPorts: any = {};
    if (d && d.ports) {
      Object.entries(d.ports).forEach(([k, p]) => {
        clonedPorts[k] = { ...(p as any) };
      });
      // Read resolved port sides from the map
      const nodeSides = portSidesMap[elkNode.id] || {};
      Object.entries(nodeSides).forEach(([portKey, side]) => {
        if (clonedPorts[portKey]) {
          clonedPorts[portKey].computedSide = side;
        }
      });
    }
    const dataWithPorts = { ...(d || {}), ports: clonedPorts };
    nodes.push({
      id: elkNode.id,
      type: 'deviceNode',
      parentId: elkNode.parent || undefined,
      position: { x: elkNode.x, y: elkNode.y },
      data: dataWithPorts,
      zIndex: 2,
      extent: elkNode.parent ? 'parent' : undefined,
    });
  }
  if (elkNode.children) {
    elkNode.children.forEach((child: any) => {
      child.parent = elkNode.id;
      nodes.push(...flattenElkGroups(child, graphData, elkNode.id, portSidesMap));
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

  useEffect(() => {
    const validation = validateGraph(graphData);
    if (!validation.valid) {
      setValidationErrors(validation.errors || []);
      return;
    }

    layoutGraph(graphData, direction).then(layouted => {
      const portSidesMap = (layouted as any).__portSides || {};
      let rfNodes: any[] = [];
      (layouted.children || []).forEach((root: any) => {
        rfNodes.push(...flattenElkGroups(root, graphData, null, portSidesMap));
      });
      setNodes(rfNodes);
      setEdges(mapEdgesToReactFlow(layouted.edges || [], graphData.edges || []));
      setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 200);
    });
  }, [graphData, direction]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
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
  );
}

export default function AVWiringViewerWrapper(props: any) {
  return (
    <ReactFlowProvider>
      <AVWiringViewer {...props} />
    </ReactFlowProvider>
  );
}
