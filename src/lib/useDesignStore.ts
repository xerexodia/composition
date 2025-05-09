import { useEffect, useState, useMemo } from 'react';
import { designStore } from './store';

export function useDesignStore() {
  const [state, setState] = useState(designStore.getState());

  useEffect(() => {
    const unsubscribe = designStore.subscribe(setState);
    return unsubscribe;
  }, []);

  const actions = useMemo(() => ({
    // Document actions
    createDocument: designStore.createDocument.bind(designStore),
    loadDocument: designStore.loadDocument.bind(designStore),
    saveDocument: designStore.saveDocument.bind(designStore),
    
    // Selection & Tool
    setTool: designStore.setTool.bind(designStore),
    setSelection: designStore.setSelection.bind(designStore),
    
    // Canvas Interactions
    startInserting: designStore.startInserting.bind(designStore),
    updateInserting: designStore.updateInserting.bind(designStore),
    completeInserting: designStore.completeInserting.bind(designStore),
    startDragging: designStore.startDragging.bind(designStore),
    updateDragging: designStore.updateDragging.bind(designStore),
    completeDragging: designStore.completeDragging.bind(designStore),
    startResizing: designStore.startResizing.bind(designStore),
    updateResizing: designStore.updateResizing.bind(designStore),
    completeResizing: designStore.completeResizing.bind(designStore),
    
    // Viewport
    panCamera: designStore.panCamera.bind(designStore),
    zoomCamera: designStore.zoomCamera.bind(designStore),
    screenToWorld: designStore.screenToWorld.bind(designStore),
    worldToScreen: designStore.worldToScreen.bind(designStore),
    
    // Undo/Redo
    undo: designStore.undo.bind(designStore),
    redo: designStore.redo.bind(designStore),
    canUndo: designStore.canUndo.bind(designStore),
    canRedo: designStore.canRedo.bind(designStore),
    
    // Preferences
    toggleDarkMode: designStore.toggleDarkMode.bind(designStore),
    setNudgeDistance: designStore.setNudgeDistance.bind(designStore),
    toggleRulers: designStore.toggleRulers.bind(designStore),
  }), []);

  return { ...state, ...actions };
}