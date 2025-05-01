import { Document, Layer } from "../../../types";

type PatchOperation = 'add' | 'remove' | 'replace' | 'move';

type BasePatch<T extends PatchOperation, V = unknown> = {
  op: T;
  path: string[];
  value?: V;
  oldValue?: V;
  index?: number;
};

export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type AddPatch = BasePatch<'add'>;
export type RemovePatch = BasePatch<'remove'>;
export type ReplacePatch = BasePatch<'replace'>;
export type MovePatch = BasePatch<'move', number>;

export type Patch = AddPatch | RemovePatch | ReplacePatch | MovePatch;

type PatchTarget = Document | Layer | string[] | RGBAColor | number | string | boolean | undefined;

export function applyPatches(document: Document, patches: Patch[]): Document {
  const newDocument = JSON.parse(JSON.stringify(document)) as Document;
  
  for (const patch of patches) {
    applySinglePatch(newDocument, patch);
  }
  
  return newDocument;
}

function applySinglePatch(target: PatchTarget, patch: Patch): void {
  if (typeof target !== 'object' || target === null) return;

  let current: Record<string, unknown> | Array<unknown> = target as Record<string, unknown>;
  
  for (let i = 0; i < patch.path.length - 1; i++) {
    if (!current[patch.path[i]]) {
      if (Array.isArray(current)) {
        throw new Error("Invalid path for array");
      }
      current[patch.path[i]] = {};
    }
    current = current[patch.path[i]] as Record<string, unknown>;
  }
  
  const lastKey = patch.path[patch.path.length - 1];
  
  switch (patch.op) {
    case 'add':
      if (Array.isArray(current)) {
        if (patch.index !== undefined) {
          current.splice(patch.index, 0, patch.value);
        } else {
          current.push(patch.value);
        }
      } else if (typeof current === 'object' && current !== null) {
        (current as Record<string, unknown>)[lastKey] = patch.value;
      }
      break;
      
    case 'remove':
      if (Array.isArray(current)) {
        if (patch.index !== undefined) {
          current.splice(patch.index, 1);
        } else if (patch.value !== undefined) {
          const index = current.indexOf(patch.value);
          if (index !== -1) current.splice(index, 1);
        }
      } else if (typeof current === 'object' && current !== null) {
        delete (current as Record<string, unknown>)[lastKey];
      }
      break;
      
    case 'replace':
      if (typeof current === 'object' && current !== null) {
        (current as Record<string, unknown>)[lastKey] = patch.value;
      }
      break;
      
    case 'move':
      if (Array.isArray(current) && patch.index !== undefined && patch.value !== undefined) {
        const [item] = current.splice(patch.value as number, 1);
        current.splice(patch.index, 0, item);
      }
      break;
  }
}

export function calculateInversePatches(document: Document, patches: Patch[]): Patch[] {
  return patches.map(patch => {
    let current: PatchTarget = document;
    
    for (const key of patch.path) {
      if (typeof current !== 'object' || current === null) break;
      current = (current as Record<string, unknown>)[key] as PatchTarget;
    }
    
    switch (patch.op) {
      case 'add':
        return {
          op: 'remove',
          path: patch.path,
          value: patch.value,
          index: patch.index,
          oldValue: current
        } as RemovePatch;
        
      case 'remove':
        return {
          op: 'add',
          path: patch.path,
          value: patch.oldValue,
          index: patch.index
        } as AddPatch;
        
      case 'replace':
        return {
          op: 'replace',
          path: patch.path,
          value: patch.oldValue,
          oldValue: patch.value
        } as ReplacePatch;
        
      case 'move':
        if (patch.index !== undefined && typeof patch.value === 'number') {
          return {
            op: 'move',
            path: patch.path,
            index: patch.value,
            value: patch.index
          } as MovePatch;
        }
        return { ...patch };
        
      default:
        throw new Error(`Unknown patch operation: ${(patch as Patch).op}`);
    }
  });
}

export function createAddPatch(path: string[], value: unknown, index?: number): AddPatch {
  return { op: 'add', path, value, index };
}

export function createRemovePatch(path: string[], oldValue?: unknown, index?: number): RemovePatch {
  return { op: 'remove', path, oldValue, index };
}

export function createReplacePatch(path: string[], value: unknown, oldValue?: unknown): ReplacePatch {
  return { op: 'replace', path, value, oldValue };
}

export function createMovePatch(path: string[], fromIndex: number, toIndex: number): MovePatch {
  return { op: 'move', path, value: fromIndex, index: toIndex };
}