import React, { useState, useEffect } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, useReactFlow } from '@xyflow/react';
import { layoutGraph } from '../lib/elkMapper';
import { validateGraph } from '../lib/validator';

const nodeTypes = {};
const edgeTypes = {};

function mapEdgesToReactFlow(elkEdges, originalEdges) {
  return elkEdges.map(elkEdge => {
    const original = originalEdges.find(e => e.id === elkEdge.id);
    return {
      id: elkEdge.id,
      source: original.source,
      target: original.target,
      animated: false,
      label: original.label || '',
      style: { stroke: 'black' }
    };
  });
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
      const rfNodes = layouted.children.flatMap(area => {
        if (area.children) {
          return area.children.map(n => ({
            id: n.id,
            position: { x: n.x, y: n.y },
            data: graphData.nodes.find(gn => gn.id === n.id),
            type: 'deviceNode'
          }));
        }
        return [{
          id: area.id,
          position: { x: area.x, y: area.y },
          data: null,
          type: 'areaNode'
        }];
      });

      setNodes(rfNodes);
      setEdges(mapEdgesToReactFlow(layouted.edges, graphData.edges));
      setTimeout(() => fitView(), 50);
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
