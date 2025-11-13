import React, { useState, useEffect } from 'react';
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

function mapEdgesToReactFlow(elkEdges, originalEdges) {
  return elkEdges.map(elkEdge => {
    const original = originalEdges.find(e => e.id === elkEdge.id);
    return {
      id: elkEdge.id,
      source: elkEdge.sources[0] || original?.source || '',
      target: elkEdge.targets[0] || original?.target || '',
      label: original?.label || '',
      animated: false,
      style: { stroke: '#344', strokeWidth: 2 },
      type: 'default'
    };
  });
}

function flattenElkGroups(elkNode, graphData, parent=null) {
  // Recursively flatten ELK to React Flow nodes, group devices by parentId
  const nodes = [];
  const isArea = graphData.areas.some(a => a.id === elkNode.id);
  if(isArea) {
    // Use ELK-calculated dimensions for areas
    nodes.push({
      id: elkNode.id,
      type: 'groupNode',
      parentId: elkNode.parent || undefined,
      position: { x: elkNode.x, y: elkNode.y },
      style: {
        width: elkNode.width || 140,
        height: elkNode.height || 70,
      },
      data: { label: elkNode.label || elkNode.id },
      selectable: true,
      draggable: true,
      expandParent: false,
    });
  } else if(graphData.nodes.some(n => n.id === elkNode.id)) {
    // normal device
    const d = graphData.nodes.find(n => n.id === elkNode.id);
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
    elkNode.children.forEach(child => {
      child.parent = elkNode.id;
      nodes.push(...flattenElkGroups(child, graphData, elkNode.id));
    });
  }
  return nodes;
}

function AVWiringViewer({ graphData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [direction, setDirection] = useState('LR');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    const validation = validateGraph(graphData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    layoutGraph(graphData, direction).then(layouted => {
      let rfNodes = [];
      layouted.children.forEach(root => {
        rfNodes.push(...flattenElkGroups(root, graphData, null));
      });
      setNodes(rfNodes);
      setEdges(mapEdgesToReactFlow(layouted.edges, graphData.edges));
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

export default function AVWiringViewerWrapper(props) {
  return (
    <ReactFlowProvider>
      <AVWiringViewer {...props} />
    </ReactFlowProvider>
  );
}
