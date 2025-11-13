// Main entry point for the React web application
import React from 'react';
import ReactDOM from 'react-dom/client';
import AVWiringViewer from './components/AVWiringViewer';
import graphData from './data/sampleGraph.json';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AVWiringViewer graphData={graphData} />
  </React.StrictMode>
);
