import React, { useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, useReactFlow } from '@xyflow/react';
import { layoutGraph } from '../lib/elkMapper';
import { validateGraph } from '../lib/validator';
import DeviceNode from './nodes/DeviceNode';

const nodeTypes = {
  deviceNode: DeviceNode
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

function flattenElk(layouted, graphData) {
  // Recursively flatten ELK-compound structure to React Flow nodes, assign positions and types.
  const nodes = [];
  function traverse(elkNode, parentIsArea) {
    // if this node matches an area in the input, render it as area (default), otherwise as deviceNode
    if(graphData.areas.some(a => a.id === elkNode.id)) {
      nodes.push({
        id: elkNode.id,
        position: { x: elkNode.x, y: elkNode.y },
        data: { label: elkNode.label },
        type: 'default',
        selectable: false,
        style: {
          background: '#eef4fb',
          border: '2px dashed #bbb',
          borderRadius: 10,
          minHeight: 60,
          minWidth: 140,
          opacity: 0.45,
          zIndex: 0
        }
      });
    } else if(graphData.nodes.some(n => n.id === elkNode.id)) {
      const d = graphData.nodes.find(n => n.id === elkNode.id);
      nodes.push({
        id: elkNode.id,
        position: { x: elkNode.x, y: elkNode.y },
        data: d,
        type: 'deviceNode',
        zIndex: 2
      });
    }
    if (elkNode.children) {
      elkNode.children.forEach(child => traverse(child, true));
    }
  }
  layouted.children.forEach(node => traverse(node, false));
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
      const rfNodes = flattenElk(layouted, graphData);
      setNodes(rfNodes);
      setEdges(mapEdgesToReactFlow(layouted.edges, graphData.edges));
      setTimeout(() => fitView({ duration: 800, padding: 0.11 }), 240);
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
        maxZoom={2.7}
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
