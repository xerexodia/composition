// src/stores/design-store.ts
import {
  DesignDocument,
  Layer,
  CanvasMode,
  AppTool,
  Vector2D,
  LayerType,
  AppState,
  ResizingPosition,
} from "../../types";
import { createDocument, getDocumentByID, saveDocument } from "./core/db";
import { documentManager } from "./core/document-manager";
import { generateDefaultLayer } from "./utils/design";

type Subscriber = (state: AppState) => void;
type Unsubscribe = () => void;

class DesignStore {
  private state: AppState = {
    currentDocument: null,
    selectedLayerIds: [],
    camera: { x: 0, y: 0, zoom: 1 },
    tool: "select",
    canvas: { mode: CanvasMode.None },
    preferences: {
      darkMode: false,
      nudgeDistance: 1,
      showRulers: true,
    },
  };

  private subscribers: Subscriber[] = [];
  private renderScheduled = false;

  constructor() {
    this.setupDocumentListeners();
  }

  // ======================
  // State Management
  // ======================
  private setState(partialState: Partial<AppState>) {
    this.state = { ...this.state, ...partialState };
    this.scheduleNotify();
  }

  private scheduleNotify() {
    if (!this.renderScheduled) {
      this.renderScheduled = true;
      requestAnimationFrame(() => {
        this.renderScheduled = false;
        this.notifySubscribers();
      });
    }
  }

  private notifySubscribers() {
    const currentState = this.getState();
    this.subscribers.forEach((subscriber) => subscriber(currentState));
  }

  private setupDocumentListeners() {
    const originalLoad = documentManager.loadDocument.bind(documentManager);
    documentManager.loadDocument = (doc: DesignDocument) => {
      const result = originalLoad(doc);
      this.setState({
        currentDocument: doc,
        selectedLayerIds: documentManager.getSelectedLayersId(),
        canvas: { mode: CanvasMode.None },
      });
      return result;
    };
  }

  // ======================
  // Public API
  // ======================
  subscribe(subscriber: Subscriber): Unsubscribe {
    this.subscribers.push(subscriber);
    subscriber(this.getState());
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== subscriber);
    };
  }

  getState(): AppState {
    return {
      ...this.state,
      currentDocument: this.state.currentDocument
        ? documentManager.getDocument()
        : null,
      selectedLayerIds: documentManager.getSelectedLayersId(),
    };
  }

  // ======================
  // Document Management
  // ======================
  async createDocument(name: string, width?: number, height?: number) {
    const doc = await createDocument(name, width, height);
    this.setState({
      currentDocument: doc,
      selectedLayerIds: [],
      canvas: { mode: CanvasMode.None },
    });
    return doc.id;
  }

  async loadDocument(documentId: string) {
    const doc = await getDocumentByID(documentId);
    if (doc) {
      documentManager.loadDocument(doc);
    }
  }

  async saveDocument() {
    if (!this.state.currentDocument) return;
    await saveDocument(this.state.currentDocument);
  }

  // ======================
  // Tool & Selection
  // ======================
  setTool(tool: AppTool) {
    if (this.state.tool !== tool) {
      this.setState({
        tool,
        canvas: { mode: CanvasMode.None },
      });
    }
  }

  setSelection(ids: string[]) {
    documentManager.setSelection(ids);
    this.notifySubscribers();
  }

  // ======================
  // Canvas Interactions
  // ======================
  startInserting(layerType: LayerType, position: Vector2D) {
    if (!this.state.currentDocument) return;

    this.setState({
      canvas: {
        mode: CanvasMode.Inserting,
        layerType,
        initialPosition: this.screenToWorld(position),
        currentPosition: this.screenToWorld(position),
      },
    });
  }

  updateInserting(currentPosition: Vector2D) {
    if (this.state.canvas.mode !== CanvasMode.Inserting) return null;

    const worldPos = this.screenToWorld(currentPosition);
    const { initialPosition } = this.state.canvas;

    this.setState({
      canvas: {
        ...this.state.canvas,
        currentPosition: worldPos,
      },
    });

    return {
      x: Math.min(initialPosition.x, worldPos.x),
      y: Math.min(initialPosition.y, worldPos.y),
      width: Math.abs(worldPos.x - initialPosition.x),
      height: Math.abs(worldPos.y - initialPosition.y),
    };
  }

  async completeInserting() {
    if (this.state.canvas.mode !== CanvasMode.Inserting) return;
    if (!this.state.currentDocument) return;

    const { initialPosition, currentPosition, layerType } = this.state.canvas;
    if (!initialPosition || !currentPosition) return;

    const bounds = {
      x: Math.min(initialPosition.x, currentPosition.x),
      y: Math.min(initialPosition.y, currentPosition.y),
      width: Math.abs(currentPosition.x - initialPosition.x),
      height: Math.abs(currentPosition.y - initialPosition.y),
    };

    if (bounds.width < 5 || bounds.height < 5) {
      this.setState({ canvas: { mode: CanvasMode.None } });
      return;
    }

    const layer = generateDefaultLayer(layerType, bounds);
    documentManager.addLayer(layer);

    this.setState({
      canvas: { mode: CanvasMode.None },
      currentDocument: documentManager.getDocument(),

      tool: "select",
    });
    await this.saveDocument();
  }

  startDragging(position: Vector2D) {
    const selectedIds = documentManager.getSelectedLayersId();
    if (selectedIds.length === 0) return;

    const originalLayers: Record<string, Layer> = {};
    selectedIds.forEach((id) => {
      const layer = documentManager.getLayerById(id);
      if (layer) originalLayers[id] = layer;
    });

    this.setState({
      canvas: {
        mode: CanvasMode.Dragging,
        origin: this.screenToWorld(position),
        originalLayers,
      },
    });
  }

  updateDragging(currentPosition: Vector2D) {
    if (this.state.canvas.mode !== CanvasMode.Dragging) return;

    const worldPos = this.screenToWorld(currentPosition);
    const delta = {
      x: worldPos.x - this.state.canvas.origin.x,
      y: worldPos.y - this.state.canvas.origin.y,
    };

    Object.entries(this.state.canvas.originalLayers).forEach(
      ([id, original]) => {
        documentManager.updateLayer(id, {
          x: original.x + delta.x,
          y: original.y + delta.y,
        });
      }
    );
  }

  completeDragging() {
    if (this.state.canvas.mode === CanvasMode.Dragging) {
      this.setState({ canvas: { mode: CanvasMode.None } });
    }
  }

  startResizing(layerId: string, handle: ResizingPosition) {
    const layer = documentManager.getLayerById(layerId);
    if (!layer) return;

    this.setState({
      canvas: {
        mode: CanvasMode.Resizing,
        layerId,
        handlePosition: handle,
        initialBounds: {
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
        },
      },
    });
  }

  updateResizing(currentPosition: Vector2D) {
    if (this.state.canvas.mode !== CanvasMode.Resizing) return;

    const worldPos = this.screenToWorld(currentPosition);
    const { layerId, handlePosition, initialBounds } = this.state.canvas;

    const newBounds = { ...initialBounds };

    if (handlePosition.includes("e")) {
      newBounds.width = worldPos.x - initialBounds.x;
    }
    if (handlePosition.includes("w")) {
      newBounds.width = initialBounds.width + (initialBounds.x - worldPos.x);
      newBounds.x = worldPos.x;
    }
    if (handlePosition.includes("s")) {
      newBounds.height = worldPos.y - initialBounds.y;
    }
    if (handlePosition.includes("n")) {
      newBounds.height = initialBounds.height + (initialBounds.y - worldPos.y);
      newBounds.y = worldPos.y;
    }

    if (newBounds.width < 5) newBounds.width = 5;
    if (newBounds.height < 5) newBounds.height = 5;

    documentManager.updateLayer(layerId, newBounds);
  }

  completeResizing() {
    if (this.state.canvas.mode === CanvasMode.Resizing) {
      this.setState({ canvas: { mode: CanvasMode.None } });
    }
  }

  // ======================
  // Viewport/Camera
  // ======================
  screenToWorld(screenPos: Vector2D): Vector2D {
    return {
      x: (screenPos.x - this.state.camera.x) / this.state.camera.zoom,
      y: (screenPos.y - this.state.camera.y) / this.state.camera.zoom,
    };
  }

  worldToScreen(worldPos: Vector2D): Vector2D {
    return {
      x: worldPos.x * this.state.camera.zoom + this.state.camera.x,
      y: worldPos.y * this.state.camera.zoom + this.state.camera.y,
    };
  }

  panCamera(delta: Vector2D) {
    this.setState({
      camera: {
        ...this.state.camera,
        x: this.state.camera.x + delta.x,
        y: this.state.camera.y + delta.y,
      },
    });
  }

  zoomCamera(zoom: number, focusPoint?: Vector2D) {
    const newZoom = Math.max(0.1, Math.min(10, zoom));

    if (focusPoint) {
      const worldPos = this.screenToWorld(focusPoint);
      this.setState({
        camera: {
          zoom: newZoom,
          x: focusPoint.x - worldPos.x * newZoom,
          y: focusPoint.y - worldPos.y * newZoom,
        },
      });
    } else {
      this.setState({
        camera: {
          ...this.state.camera,
          zoom: newZoom,
        },
      });
    }
  }

  // ======================
  // Undo/Redo
  // ======================
  async undo() {
    if (documentManager.canUndo()) {
      documentManager.undo();
      this.setState({
        currentDocument: documentManager.getDocument(),
        canvas: { mode: CanvasMode.None },
      });
    }
  }

  async redo() {
    if (documentManager.canRedo()) {
      documentManager.redo();
      this.setState({
        currentDocument: documentManager.getDocument(),
        canvas: { mode: CanvasMode.None },
      });
    }
  }

  canUndo(): boolean {
    return documentManager.canUndo();
  }

  canRedo(): boolean {
    return documentManager.canRedo();
  }

  // ======================
  // Preferences
  // ======================
  toggleDarkMode() {
    this.setState({
      preferences: {
        ...this.state.preferences,
        darkMode: !this.state.preferences.darkMode,
      },
    });
  }

  setNudgeDistance(distance: number) {
    this.setState({
      preferences: {
        ...this.state.preferences,
        nudgeDistance: Math.max(0.1, distance),
      },
    });
  }

  toggleRulers() {
    this.setState({
      preferences: {
        ...this.state.preferences,
        showRulers: !this.state.preferences.showRulers,
      },
    });
  }
}

export const designStore = new DesignStore();
