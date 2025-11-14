// Storage utilities for managing saved graph configurations

const STORAGE_KEY_GRAPHS = 'avflow-saved-graphs';
const STORAGE_KEY_CURRENT = 'avflow-current-graph';

export interface SavedGraph {
  id: string;
  name: string;
  data: any;
  saved: string; // ISO timestamp
}

export interface StoredGraphs {
  [id: string]: SavedGraph;
}

/**
 * Get all saved graphs from localStorage
 */
export function getAllSavedGraphs(): StoredGraphs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GRAPHS);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading saved graphs:', error);
    return {};
  }
}

/**
 * Get a specific saved graph by ID
 */
export function getSavedGraph(id: string): SavedGraph | null {
  const graphs = getAllSavedGraphs();
  return graphs[id] || null;
}

/**
 * Save a graph configuration
 */
export function saveGraph(id: string, name: string, data: any): void {
  try {
    const graphs = getAllSavedGraphs();
    graphs[id] = {
      id,
      name,
      data,
      saved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_GRAPHS, JSON.stringify(graphs));
  } catch (error) {
    console.error('Error saving graph:', error);
    throw new Error('Failed to save graph. Storage may be full.');
  }
}

/**
 * Delete a saved graph
 */
export function deleteGraph(id: string): void {
  try {
    const graphs = getAllSavedGraphs();
    delete graphs[id];
    localStorage.setItem(STORAGE_KEY_GRAPHS, JSON.stringify(graphs));
    
    // If this was the current graph, clear current
    if (getCurrentGraphId() === id) {
      clearCurrentGraph();
    }
  } catch (error) {
    console.error('Error deleting graph:', error);
    throw new Error('Failed to delete graph.');
  }
}

/**
 * Get the ID of the currently active graph
 */
export function getCurrentGraphId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_CURRENT);
  } catch (error) {
    console.error('Error loading current graph ID:', error);
    return null;
  }
}

/**
 * Set the currently active graph ID
 */
export function setCurrentGraphId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, id);
  } catch (error) {
    console.error('Error setting current graph ID:', error);
  }
}

/**
 * Clear the current graph ID
 */
export function clearCurrentGraph(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT);
  } catch (error) {
    console.error('Error clearing current graph ID:', error);
  }
}

/**
 * Generate a unique ID for a new graph
 */
export function generateGraphId(): string {
  return `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a graph name already exists
 */
export function isNameTaken(name: string, excludeId?: string): boolean {
  const graphs = getAllSavedGraphs();
  return Object.values(graphs).some(
    (g) => g.name.toLowerCase() === name.toLowerCase() && g.id !== excludeId
  );
}

/**
 * Export graph data as JSON string
 */
export function exportGraphAsJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download graph data as a .json file
 */
export function downloadGraphAsFile(data: any, filename: string): void {
  const json = exportGraphAsJson(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
