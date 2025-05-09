import { DesignDocument, Layer, Patch } from "../../../types";
import { deepClone } from "../utils/objects";
import {
  createAddPatch,
  createRemovePatch,
  createReplacePatch,
  PatchSystem,
} from "../../lib/utils/patch-utils";

export class DocumentManager {
  private currentDocument: DesignDocument | null = null;
  private patchHistory: Patch[][] = [];
  private redoStack: Patch[][] = [];
  private pendingPatches: Patch[] = [];
  private saveTimer: NodeJS.Timeout | null = null;
  private readonly SAVE_DEBOUNCE = 100;
  private layerCache = new Map<string, Layer>();
  private selection: string[] = [];

  public loadDocument(document: DesignDocument): void {
    this.currentDocument = deepClone(document);
    this.patchHistory = [];
    this.redoStack = [];
    this.pendingPatches = [];
    this.layerCache.clear();
    this.selection = [];
    this.clearPendingChanges();
  }

  public getDocument(): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");
    return deepClone(this.currentDocument);
  }

  public getLayerById(layerId: string): Layer | null {
    if (!this.currentDocument) return null;
    if (this.layerCache.has(layerId))
      return deepClone(this.layerCache.get(layerId)!);

    const layer = this.currentDocument.layers[layerId];
    if (layer) {
      this.layerCache.set(layerId, layer);
      return deepClone(layer);
    }
    return null;
  }

  public getLayersOrder(): string[] {
    return this.currentDocument ? [...this.currentDocument.rootLayerIds] : [];
  }

  public getSelectedLayers(): Record<string, Layer> {
    const result: Record<string, Layer> = {};
    for (const id of this.selection) {
      const layer = this.getLayerById(id);
      if (layer) result[id] = layer;
    }
    return result;
  }

  public setSelection(layerIds: string[]): void {
    if (!this.currentDocument) return;
    this.selection = layerIds.filter(
      (id) => id in this.currentDocument!.layers
    );
  }

  public getSelectedLayersId() {
    return this.selection;
  }

  public addLayer(layer: Layer, insertIndex?: number): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");
    if (this.currentDocument.layers[layer.id])
      throw new Error(`Layer ${layer.id} exists`);

    const patches: Patch[] = [
      createAddPatch(["layers", layer.id], layer),
      createAddPatch(
        ["rootLayerIds"],
        layer.id,
        insertIndex ?? this.currentDocument.rootLayerIds.length
      ),
    ];

    this.selection = [layer.id];
    return this.applyPatches(patches);
  }

  public removeLayers(layerIds: string[]): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");

    const patches: Patch[] = [];
    const layersToRemove = layerIds.filter(
      (id) => id in this.currentDocument!.layers
    );

    for (const layerId of layersToRemove) {
      const currentIndex = this.currentDocument.rootLayerIds.indexOf(layerId);
      if (currentIndex !== -1) {
        patches.push(
          createRemovePatch(["rootLayerIds"], undefined, currentIndex)
        );
      }
      patches.push(createRemovePatch(["layers", layerId]));
      this.layerCache.delete(layerId);
    }

    this.selection = this.selection.filter((id) => !layerIds.includes(id));
    return this.applyPatches(patches);
  }

  public updateLayer(layerId: string, changes: Partial<Layer>): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");
    if (!this.currentDocument.layers[layerId])
      throw new Error(`Layer ${layerId} not found`);

    const patches: Patch[] = [];
    for (const [key, value] of Object.entries(changes)) {
      patches.push(createReplacePatch(["layers", layerId, key], value));
    }

    if (this.layerCache.has(layerId)) {
      const cached = this.layerCache.get(layerId)!;
      this.layerCache.set(layerId, { ...cached, ...changes } as Layer);
    }

    return this.applyPatches(patches);
  }

  public moveLayers(layerIds: string[], newIndex: number): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");

    const validLayerIds = layerIds.filter(
      (id) => id in this.currentDocument!.layers
    );
    if (validLayerIds.length === 0) return this.getDocument();

    const patches: Patch[] = [];
    const currentOrder = [...this.currentDocument.rootLayerIds];

    for (const layerId of validLayerIds) {
      const currentIndex = currentOrder.indexOf(layerId);
      if (currentIndex !== -1) {
        patches.push(
          createRemovePatch(["rootLayerIds"], undefined, currentIndex)
        );
        currentOrder.splice(currentIndex, 1);
      }
    }

    const adjustedIndex = Math.max(0, Math.min(newIndex, currentOrder.length));

    for (let i = validLayerIds.length - 1; i >= 0; i--) {
      patches.push(
        createAddPatch(["rootLayerIds"], validLayerIds[i], adjustedIndex)
      );
    }

    return this.applyPatches(patches);
  }

  public bringLayersForward(layerIds: string[]): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");
    return this.moveLayersRelative(layerIds, 1);
  }

  public sendLayersBackward(layerIds: string[]): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");
    return this.moveLayersRelative(layerIds, -1);
  }

  private moveLayersRelative(
    layerIds: string[],
    delta: number
  ): DesignDocument {
    const currentOrder = [...this.currentDocument!.rootLayerIds];
    const layersToMove = layerIds.filter((id) => currentOrder.includes(id));
    if (layersToMove.length === 0) return this.getDocument();

    const patches: Patch[] = [];
    const newOrder = [...currentOrder];

    for (const layerId of layersToMove) {
      const index = newOrder.indexOf(layerId);
      if (index !== -1) newOrder.splice(index, 1);
    }

    const minIndex = Math.min(
      ...layersToMove.map((id) => currentOrder.indexOf(id))
    );
    const newPosition = Math.max(
      0,
      Math.min(currentOrder.length - 1, minIndex + delta)
    );

    newOrder.splice(newPosition, 0, ...layersToMove);
    patches.push(createReplacePatch(["rootLayerIds"], newOrder));

    return this.applyPatches(patches);
  }

  public undo(): DesignDocument {
    if (!this.currentDocument || this.patchHistory.length === 0) {
      throw new Error("Nothing to undo");
    }

    const lastPatches = this.patchHistory.pop()!;
    const inversePatches = PatchSystem.calculateInversePatches(
      this.currentDocument,
      lastPatches
    );
    this.currentDocument = PatchSystem.applyPatches(
      this.currentDocument,
      inversePatches
    );
    this.redoStack.push(lastPatches);
    this.updateCacheForPatches(lastPatches);
    return this.getDocument();
  }

  public redo(): DesignDocument {
    if (!this.currentDocument || this.redoStack.length === 0) {
      throw new Error("Nothing to redo");
    }

    const patches = this.redoStack.pop()!;
    this.currentDocument = PatchSystem.applyPatches(
      this.currentDocument,
      patches
    );
    this.patchHistory.push(patches);
    this.updateCacheForPatches(patches);
    return this.getDocument();
  }

  public canUndo(): boolean {
    return this.patchHistory.length > 0;
  }
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private applyPatches(patches: Patch[]): DesignDocument {
    if (!this.currentDocument) throw new Error("No document loaded");

    this.currentDocument = PatchSystem.applyPatches(
      this.currentDocument,
      patches
    );
    this.patchHistory.push(patches);
    this.redoStack = [];
    this.updateCacheForPatches(patches);
    this.queuePatchesForSave(patches);
    return this.getDocument();
  }

  private updateCacheForPatches(patches: Patch[]): void {
    for (const patch of patches) {
      if (patch.path[0] === "layers" && patch.path.length >= 2) {
        this.layerCache.delete(patch.path[1]);
      }
    }
  }

  private queuePatchesForSave(patches: Patch[]): void {
    this.pendingPatches.push(...patches);
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }

  private clearPendingChanges(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.pendingPatches = [];
  }

  public dispose(): void {
    this.clearPendingChanges();
    this.currentDocument = null;
    this.patchHistory = [];
    this.redoStack = [];
    this.layerCache.clear();
  }
}

export const documentManager = new DocumentManager();
