// Main entry point for the React web application
import '@xyflow/react/dist/style.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import AVWiringViewer from './components/AVWiringViewer';
import graphData from './data/debug-simple.json';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AVWiringViewer graphData={graphData} />
  </React.StrictMode>
);
