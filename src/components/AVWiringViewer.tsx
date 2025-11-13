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
      source: original.source,
      target: original.target,
      animated: false,
      label: original.label || '',
      style: { stroke: 'black' }
    };
  });
}

function areaNodeRenderer(node) {
  // Render area as a labeled box
  return {
    ...node,
    data: { label: node.data?.label || node.id },
    style: {
      background: '#eef4fb',
      border: '2px dashed #aaa',
      borderRadius: 10,
      minHeight: 60,
      minWidth: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.55,
      zIndex: 0
    }
  };
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
      // area children to nodes, areas themselves as area nodes
      const rfNodes = layouted.children.flatMap(area => {
        if (area.children) {
          // area as box
          const areaBox = areaNodeRenderer({
            id: area.id,
            position: { x: area.x, y: area.y },
            data: { label: area.label },
            type: 'default',
            selectable: false,
            zIndex: 0
          });
          // children
          const areaChildren = area.children.map(n => ({
            id: n.id,
            position: { x: n.x, y: n.y },
            data: graphData.nodes.find(gn => gn.id === n.id),
            type: 'deviceNode',
            zIndex: 2
          }));
          return [areaBox, ...areaChildren];
        }
        // areas ohne children ausblenden
        return [];
      });
      setNodes(rfNodes);
      setEdges(mapEdgesToReactFlow(layouted.edges, graphData.edges));
      setTimeout(() => fitView({ duration: 800, padding: 0.12 }), 200);
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
