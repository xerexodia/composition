import { useState, useCallback, useMemo } from "react";
import { designStore } from "./store";
import { Layer, AppTool, Vector2D } from "../../types";

export const useDesignStore = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stableDesignStore = useMemo(() => designStore, []);

  const loadDocument = useCallback(
    async (documentId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await stableDesignStore.loadDocument(documentId);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load document")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [stableDesignStore]
  );

  const getLayerById = useCallback(
    (id: string): Layer | undefined => {
      return designStore.getState()?.currentDocument?.layers[id];
    },
    [designStore.getState()?.currentDocument]
  );

  const createDocument = useCallback(
    async (name: string) => {
      setIsLoading(true);
      setError(null);
      try {
        return await stableDesignStore.createDocument(name);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create document")
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableDesignStore]
  );

  const addLayer = useCallback(
    async (layer: Layer, parentId?: string | null) => {
      setIsLoading(true);
      setError(null);
      try {
        await stableDesignStore.addLayer(layer, parentId ?? null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to add layer"));
      } finally {
        setIsLoading(false);
      }
    },
    [stableDesignStore]
  );

  const deleteSelectedLayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await stableDesignStore.deleteSelectedLayers();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to delete layers")
      );
    } finally {
      setIsLoading(false);
    }
  }, [stableDesignStore]);

  const moveSelectedLayers = useCallback(
    async (delta: Vector2D) => {
      setIsLoading(true);
      setError(null);
      try {
        await stableDesignStore.moveSelectedLayers(delta);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to move layers")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [stableDesignStore]
  );

  const selectLayers = useCallback(
    (ids: string[]) => {
      stableDesignStore.selectLayers(ids);
    },
    [stableDesignStore]
  );

  const setTool = useCallback(
    (tool: AppTool) => {
      stableDesignStore.setTool(tool);
    },
    [stableDesignStore]
  );

  const undo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await stableDesignStore.undo();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to undo"));
    } finally {
      setIsLoading(false);
    }
  }, [stableDesignStore]);

  const redo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await stableDesignStore.redo();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to redo"));
    } finally {
      setIsLoading(false);
    }
  }, [stableDesignStore]);

  const actions = useMemo(
    () => ({
      loadDocument,
      createDocument,
      addLayer,
      deleteSelectedLayers,
      moveSelectedLayers,
      selectLayers,
      setTool,
      undo,
      redo,
      getLayerById,
    }),
    [
      loadDocument,
      createDocument,
      addLayer,
      deleteSelectedLayers,
      moveSelectedLayers,
      selectLayers,
      setTool,
      undo,
      redo,
      getLayerById,
    ]
  );

  const isLayerSelected = useCallback(
    (id: string) => designStore.getState().selectedLayerIds.includes(id),
    [designStore.getState().selectedLayerIds]
  );

  const canUndo = stableDesignStore.undoStack.length > 0;
  const canRedo = stableDesignStore.redoStack.length > 0;

  return {
    ...designStore.getState(),
    ...actions,
    isLoading,
    error,
    isLayerSelected,
    canUndo,
    canRedo,
  };
};
