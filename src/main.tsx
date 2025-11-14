// Main entry point for the React web application
import '@xyflow/react/dist/style.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import GraphDataManager from './components/GraphDataManager';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <GraphDataManager />
  </React.StrictMode>
);
