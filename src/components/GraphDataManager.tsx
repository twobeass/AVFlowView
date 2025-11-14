import { useState, useEffect, useRef } from 'react';
import AVWiringViewer from './AVWiringViewer';
import { validateGraph } from '../lib/validator';
import {
  getAllSavedGraphs,
  getSavedGraph,
  saveGraph,
  deleteGraph,
  getCurrentGraphId,
  setCurrentGraphId,
  generateGraphId,
  isNameTaken,
  downloadGraphAsFile,
} from '../lib/storage';
import sampleGraphData from '../data/sampleGraph.json';

const SAMPLE_GRAPH_ID = 'sample-graph';

export default function GraphDataManager() {
  const [graphData, setGraphData] = useState<any>(null);
  const [currentGraphId, setCurrentGraphIdState] = useState<string | null>(null);
  const [currentGraphName, setCurrentGraphName] = useState<string>('Sample Graph');
  const [savedGraphs, setSavedGraphs] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [saveNameInput, setSaveNameInput] = useState('');
  const [simplifiedMode, setSimplifiedMode] = useState(() => {
    // Load simplified mode preference from localStorage
    const saved = localStorage.getItem('avflowview-simplified-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial graph on mount
  useEffect(() => {
    loadInitialGraph();
  }, []);

  // Save simplified mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('avflowview-simplified-mode', JSON.stringify(simplifiedMode));
  }, [simplifiedMode]);

  // Refresh saved graphs list whenever needed
  const refreshSavedGraphs = () => {
    setSavedGraphs(getAllSavedGraphs());
  };

  const loadInitialGraph = () => {
    const lastGraphId = getCurrentGraphId();
    
    if (lastGraphId) {
      const saved = getSavedGraph(lastGraphId);
      if (saved) {
        setGraphData(saved.data);
        setCurrentGraphIdState(saved.id);
        setCurrentGraphName(saved.name);
        refreshSavedGraphs();
        return;
      }
    }
    
    // Default to sample graph
    setGraphData(sampleGraphData);
    setCurrentGraphIdState(SAMPLE_GRAPH_ID);
    setCurrentGraphName('Sample Graph');
    refreshSavedGraphs();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        loadGraphData(data, file.name.replace('.json', ''));
      } catch (err) {
        setError('Invalid JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteJson = () => {
    try {
      const data = JSON.parse(pasteText);
      loadGraphData(data, 'Pasted Graph');
      setShowPasteModal(false);
      setPasteText('');
    } catch (err) {
      setError('Invalid JSON. Please check the format and try again.');
    }
  };

  const loadGraphData = (data: any, suggestedName: string) => {
    const validation = validateGraph(data);
    if (!validation.valid) {
      const errorMessages = validation.errors?.map((e: any) => `${e.path}: ${e.message}`).join(', ') || 'Unknown validation error';
      setError(`Graph validation failed: ${errorMessages}`);
      return;
    }

    setGraphData(data);
    setCurrentGraphIdState(null); // Unsaved graph
    setCurrentGraphName(suggestedName);
    setError(null);
  };

  const handleSaveGraph = () => {
    if (!saveNameInput.trim()) {
      setError('Please enter a name for this configuration.');
      return;
    }

    if (isNameTaken(saveNameInput, currentGraphId || undefined)) {
      setError('A configuration with this name already exists. Please choose a different name.');
      return;
    }

    try {
      const id = currentGraphId || generateGraphId();
      saveGraph(id, saveNameInput.trim(), graphData);
      setCurrentGraphIdState(id);
      setCurrentGraphName(saveNameInput.trim());
      setCurrentGraphId(id);
      refreshSavedGraphs();
      setShowSaveModal(false);
      setSaveNameInput('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    }
  };

  const handleLoadGraph = (graphId: string) => {
    if (graphId === SAMPLE_GRAPH_ID) {
      setGraphData(sampleGraphData);
      setCurrentGraphIdState(SAMPLE_GRAPH_ID);
      setCurrentGraphName('Sample Graph');
      setCurrentGraphId(SAMPLE_GRAPH_ID);
      setError(null);
      return;
    }

    const saved = getSavedGraph(graphId);
    if (saved) {
      setGraphData(saved.data);
      setCurrentGraphIdState(saved.id);
      setCurrentGraphName(saved.name);
      setCurrentGraphId(saved.id);
      setError(null);
    }
  };

  const handleDeleteGraph = (graphId: string) => {
    if (graphId === SAMPLE_GRAPH_ID) return; // Can't delete sample

    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        deleteGraph(graphId);
        refreshSavedGraphs();
        
        // If we deleted the current graph, load sample
        if (currentGraphId === graphId) {
          handleLoadGraph(SAMPLE_GRAPH_ID);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete configuration.');
      }
    }
  };

  const handleExportGraph = () => {
    const filename = currentGraphName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    downloadGraphAsFile(graphData, filename);
  };

  const openSaveModal = () => {
    setSaveNameInput(currentGraphName === 'Sample Graph' ? '' : currentGraphName);
    setShowSaveModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        flexWrap: 'wrap',
      }}>
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          📁 Upload JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Paste Button */}
        <button
          onClick={() => setShowPasteModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          📋 Paste JSON
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }} />

        {/* Save Button */}
        <button
          onClick={openSaveModal}
          disabled={!graphData}
          style={{
            padding: '8px 16px',
            backgroundColor: graphData ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: graphData ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          💾 Save As...
        </button>

        {/* Load Dropdown */}
        <select
          value={currentGraphId || ''}
          onChange={(e) => handleLoadGraph(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '150px',
          }}
        >
          <option value={SAMPLE_GRAPH_ID}>Sample Graph</option>
          {Object.values(savedGraphs).map((graph: any) => (
            <option key={graph.id} value={graph.id}>
              {graph.name}
            </option>
          ))}
        </select>

        {/* Delete Button */}
        {currentGraphId && currentGraphId !== SAMPLE_GRAPH_ID && (
          <button
            onClick={() => handleDeleteGraph(currentGraphId)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            🗑️ Delete
          </button>
        )}

        <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }} />

        {/* Export Button */}
        <button
          onClick={handleExportGraph}
          disabled={!graphData}
          style={{
            padding: '8px 16px',
            backgroundColor: graphData ? '#FF9800' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: graphData ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          ⬇️ Export
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }} />

        {/* Simplified View Toggle */}
        <button
          onClick={() => setSimplifiedMode(!simplifiedMode)}
          disabled={!graphData}
          style={{
            padding: '8px 16px',
            backgroundColor: graphData ? (simplifiedMode ? '#9C27B0' : '#673AB7') : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: graphData ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          🔀 {simplifiedMode ? 'Detailed View' : 'Simplified View'}
        </button>

        {/* Current Graph Name Display */}
        <div style={{
          marginLeft: 'auto',
          padding: '8px 12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1976d2',
        }}>
          {currentGraphName}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderBottom: '1px solid #ef9a9a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c62828',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Graph Viewer */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {graphData ? (
          <AVWiringViewer graphData={graphData} simplifiedMode={simplifiedMode} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
          }}>
            No graph loaded. Upload or paste a JSON file to get started.
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h2 style={{ marginTop: 0 }}>Paste JSON</h2>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your JSON graph data here..."
              style={{
                flex: 1,
                minHeight: '300px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePasteJson}
                disabled={!pasteText.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: pasteText.trim() ? '#2196F3' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Load Graph
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
          }}>
            <h2 style={{ marginTop: 0 }}>Save Configuration</h2>
            <input
              type="text"
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              placeholder="Enter configuration name..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveGraph();
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveNameInput('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGraph}
                disabled={!saveNameInput.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: saveNameInput.trim() ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saveNameInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
