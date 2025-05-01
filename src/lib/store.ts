import { Document, Layer, AppState, AppTool, Vector2D } from "../../types";
import {
  saveDocument,
  loadDocument,
  watchDocument,
  saveHistory,
  loadHistory,
  getDB,
  createDocument as dbCreateDocument,
} from "./db";
import {
  applyPatches,
  calculateInversePatches,
  Patch,
  createAddPatch,
  createRemovePatch,
  createReplacePatch,
} from "./utils/patch-utils";

type HistoryEntry = {
  patches: Patch[];
  inversePatches: Patch[];
};

class DesignStore {
  private state: AppState;
  private subscribers: Set<(state: AppState) => void> = new Set();
  private _undoStack: HistoryEntry[] = [];
  private _redoStack: HistoryEntry[] = [];
  private currentDocumentId: string | null = null;
  private unsubscribeFromUpdates: (() => void) | null = null;

  constructor() {
    this.state = {
      currentDocument: null,
      selectedLayerIds: [],
      camera: { x: 0, y: 0, zoom: 1 },
      tool: "select",
    };
  }

  get undoStack(): ReadonlyArray<HistoryEntry> {
    return this._undoStack;
  }

  get redoStack(): ReadonlyArray<HistoryEntry> {
    return this._redoStack;
  }

  async createDocument(name: string): Promise<Document> {
    const doc = await dbCreateDocument(name);
    return doc;
  }

  async loadDocument(documentId: string): Promise<void> {
    if (this.unsubscribeFromUpdates) {
      this.unsubscribeFromUpdates();
    }

    const doc = await loadDocument(documentId);
    if (!doc) throw new Error("Document not found");

    const history = await loadHistory(documentId);
    this._undoStack = await Promise.all(
      history.map(async (entry) => ({
        patches: entry.patches,
        inversePatches: calculateInversePatches(
          await this.getDocumentAtVersion(documentId, entry.version - 1),
          entry.patches
        ),
      }))
    );

    this.currentDocumentId = documentId;
    this.state = {
      ...this.state,
      currentDocument: doc,
      selectedLayerIds: [],
    };
    this._redoStack = [];

    this.unsubscribeFromUpdates = watchDocument(documentId, (updatedDoc) => {
      if (updatedDoc.version > (this.state.currentDocument?.version || 0)) {
        this.state.currentDocument = updatedDoc;
        this.notifySubscribers();
      }
    });

    this.notifySubscribers();
  }

  private async getDocumentAtVersion(
    documentId: string,
    version: number
  ): Promise<Document> {
    if (version === 0) {
      const db = await getDB();
      const doc = await db.get("documents", documentId);
      if (!doc) throw new Error("Document not found");
      return { ...doc, version: 0 };
    }

    const history = await loadHistory(documentId);
    let doc = await this.getDocumentAtVersion(documentId, 0);

    for (const entry of history) {
      if (entry.version <= version) {
        doc = applyPatches(doc, entry.patches);
      } else {
        break;
      }
    }

    return doc;
  }

  async applyPatches(patches: Patch[], sourceTab = true): Promise<void> {
    if (!this.state.currentDocument || !this.currentDocumentId) return;

    const currentDoc = this.state.currentDocument;
    const inversePatches = calculateInversePatches(currentDoc, patches);
    const newDoc = applyPatches(currentDoc, patches);

    this.state.currentDocument = {
      ...newDoc,
      version: currentDoc.version + 1,
      updatedAt: new Date(),
    };

    this._undoStack.push({ patches, inversePatches });
    this._redoStack = [];

    if (sourceTab) {
      await saveDocument(this.state.currentDocument);
      await saveHistory(
        this.currentDocumentId,
        this.state.currentDocument.version,
        patches
      );
    }

    this.notifySubscribers();
  }

  async addLayer(layer: Layer, parentId: string | null = null): Promise<void> {
    if (!this.state.currentDocument) return;

    const patches: Patch[] = [createAddPatch(["layers", layer.id], layer)];

    if (parentId) {
      const parent = this.state.currentDocument.layers[parentId];
      if (parent?.type === "group") {
        const currentChildren = Array.isArray(parent.children)
          ? parent.children
          : [];
        patches.push(
          createReplacePatch(
            ["layers", parentId, "children"],
            [...currentChildren, layer.id],
            currentChildren
          )
        );
      }
    } else {
      const currentRootIds = Array.isArray(
        this.state.currentDocument.rootLayerIds
      )
        ? this.state.currentDocument.rootLayerIds
        : [];
      patches.push(
        createReplacePatch(
          ["rootLayerIds"],
          [...currentRootIds, layer.id],
          currentRootIds
        )
      );
    }

    await this.applyPatches(patches);
    this.selectLayers([layer.id]);
  }

  async deleteSelectedLayers(): Promise<void> {
    if (!this.state.currentDocument || this.state.selectedLayerIds.length === 0)
      return;

    const patches: Patch[] = [];
    const doc = this.state.currentDocument;

    for (const layerId of this.state.selectedLayerIds) {
      if (doc.layers[layerId]) {
        patches.push(
          createRemovePatch(["layers", layerId], doc.layers[layerId])
        );

        const rootIndex = doc.rootLayerIds.indexOf(layerId);
        if (rootIndex !== -1) {
          patches.push(createRemovePatch(["rootLayerIds"], layerId, rootIndex));
        } else {
          for (const [parentId, parent] of Object.entries(doc.layers)) {
            if (parent.type === "group" && parent.children.includes(layerId)) {
              const childIndex = parent.children.indexOf(layerId);
              patches.push(
                createRemovePatch(
                  ["layers", parentId, "children"],
                  layerId,
                  childIndex
                )
              );
            }
          }
        }
      }
    }

    await this.applyPatches(patches);
    this.selectLayers([]);
  }

  async moveSelectedLayers(delta: Vector2D): Promise<void> {
    if (!this.state.currentDocument || this.state.selectedLayerIds.length === 0)
      return;

    const patches: Patch[] = [];
    const doc = this.state.currentDocument;

    for (const layerId of this.state.selectedLayerIds) {
      const layer = doc.layers[layerId];
      if (layer) {
        patches.push(
          createReplacePatch(
            ["layers", layerId, "x"],
            layer.x + delta.x,
            layer.x
          ),
          createReplacePatch(
            ["layers", layerId, "y"],
            layer.y + delta.y,
            layer.y
          )
        );
      }
    }

    await this.applyPatches(patches);
  }

  async undo(): Promise<void> {
    if (this.undoStack.length === 0 || !this.currentDocumentId) return;

    const lastAction = this.undoStack[this.undoStack.length - 1];
    if (lastAction.inversePatches.length === 0) {
      lastAction.inversePatches = calculateInversePatches(
        this.state.currentDocument!,
        lastAction.patches
      );
    }

    const newDoc = applyPatches(
      this.state.currentDocument!,
      lastAction.inversePatches
    );

    this.state.currentDocument = {
      ...newDoc,
      version: newDoc.version + 1,
      updatedAt: new Date(),
    };

    this._redoStack.push({
      patches: lastAction.inversePatches,
      inversePatches: lastAction.patches,
    });
    this._undoStack.pop();

    await saveDocument(this.state.currentDocument);
    await saveHistory(
      this.currentDocumentId,
      this.state.currentDocument.version,
      lastAction.inversePatches
    );

    this.notifySubscribers();
  }

  async redo(): Promise<void> {
    if (this.redoStack.length === 0 || !this.currentDocumentId) return;

    const nextAction = this.redoStack[this.redoStack.length - 1];
    const newDoc = applyPatches(
      this.state.currentDocument!,
      nextAction.patches
    );

    this.state.currentDocument = {
      ...newDoc,
      version: newDoc.version + 1,
      updatedAt: new Date(),
    };

    this._undoStack.push({
      patches: nextAction.patches,
      inversePatches: nextAction.inversePatches,
    });
    this._redoStack.pop();

    await saveDocument(this.state.currentDocument);
    await saveHistory(
      this.currentDocumentId,
      this.state.currentDocument.version,
      nextAction.patches
    );

    this.notifySubscribers();
  }

  selectLayers(ids: string[]): void {
    this.state.selectedLayerIds = ids;
    this.notifySubscribers();
  }

  setTool(tool: AppTool): void {
    this.state.tool = tool;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    const state = this.getState();
    for (const sub of this.subscribers) {
      sub(state);
    }
  }

  subscribe(callback: (state: AppState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  getState(): AppState {
    return { ...this.state };
  }
}

export const designStore = new DesignStore();
