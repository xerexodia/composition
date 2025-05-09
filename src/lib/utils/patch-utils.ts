import {
  AddPatch,
  DesignDocument,
  Layer,
  MovePatch,
  Patch,
  RemovePatch,
  ReplacePatch,
  RGBAColor,
} from "../../../types";
import { deepClone } from "./objects";

type PatchTarget =
  | DesignDocument
  | Layer
  | unknown[]
  | RGBAColor
  | number
  | string
  | boolean
  | undefined
  | null;

export class PatchSystem {
  static applyPatches(
    document: DesignDocument,
    patches: Patch[]
  ): DesignDocument {
    const newDocument = deepClone(document);
    for (const patch of patches) {
      this.applySinglePatch(newDocument, patch);
    }
    return newDocument;
  }

  private static applySinglePatch(target: PatchTarget, patch: Patch): void {
    if (typeof target !== "object" || target === null) {
      throw new Error(
        `Cannot apply patch to non-object target at path ${patch.path.join(
          "/"
        )}`
      );
    }

    const { current, lastKey } = this.resolvePatchPath(target, patch.path);

    try {
      switch (patch.op) {
        case "add":
          this.applyAddOperation(current, lastKey, patch);
          break;
        case "remove":
          this.applyRemoveOperation(current, lastKey, patch);
          break;
        case "replace":
          this.applyReplaceOperation(current, lastKey, patch);
          break;
        case "move":
          this.applyMoveOperation(current, lastKey, patch);
          break;
        default:
          throw new Error(`Unknown patch operation: ${(patch as Patch).op}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to apply ${patch.op} operation at path ${patch.path.join(
          "/"
        )}: ${error}`
      );
    }
  }

  private static resolvePatchPath(target: PatchTarget, path: string[]) {
    let current: Record<string, unknown> | unknown[] = target as Record<
      string,
      unknown
    >;
    if (path.length === 0) {
      throw new Error("Cannot resolve an empty path");
    }
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      current = Array.isArray(current)
        ? (current[this.parseArrayIndex(key)] as
            | Record<string, unknown>
            | unknown[])
        : (current[key] as Record<string, unknown> | unknown[]);

      if (typeof current !== "object" || current === null) {
        throw new Error(
          `Path ${path.slice(0, i + 1).join("/")} points to non-object value`
        );
      }
    }

    return { current, lastKey: path[path.length - 1] };
  }

  private static parseArrayIndex(key: string): number {
    const index = parseInt(key, 10);
    if (isNaN(index) || index.toString() !== key) {
      throw new Error(`Invalid array index: ${key}`);
    }
    return index;
  }

  private static applyAddOperation(
    current: Record<string, unknown> | unknown[],
    lastKey: string,
    patch: AddPatch
  ): void {
    if (Array.isArray(current)) {
      const index = patch.index ?? current.length;
      if (index < 0 || index > current.length) {
        throw new Error(`Invalid array index: ${index}`);
      }
      (current as unknown[]).splice(index, 0, patch.value);
      return;
    }

    const existing = (current as Record<string, unknown>)[lastKey];
    if (Array.isArray(existing)) {
      const index = patch.index ?? existing.length;
      if (index < 0 || index > existing.length) {
        throw new Error(`Invalid array index: ${index}`);
      }
      existing.splice(index, 0, patch.value);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
      throw new Error(`Key "${lastKey}" already exists and is not an array`);
    }

    (current as Record<string, unknown>)[lastKey] = patch.value;
  }

  private static applyRemoveOperation(
    current: Record<string, unknown> | unknown[],
    lastKey: string,
    patch: RemovePatch
  ): void {
    if (Array.isArray(current)) {
      const index =
        patch.index !== undefined ? patch.index : this.parseArrayIndex(lastKey);
      if (index < 0 || index >= current.length)
        throw new Error(`Invalid array index: ${index}`);
      current.splice(index, 1);
    } else {
      if (current[lastKey] === undefined)
        throw new Error(`Key ${lastKey} does not exist`);
      delete current[lastKey];
    }
  }

  private static applyReplaceOperation(
    current: Record<string, unknown> | unknown[],
    lastKey: string,
    patch: ReplacePatch
  ): void {
    if (patch.value === undefined)
      throw new Error("Replace patch requires a value");

    if (Array.isArray(current)) {
      const index = this.parseArrayIndex(lastKey);
      if (index < 0 || index >= current.length)
        throw new Error(`Array index out of bounds: ${index}`);
      current[index] = patch.value;
    } else {
      if (current[lastKey] === undefined)
        throw new Error(`Key ${lastKey} does not exist`);
      current[lastKey] = patch.value;
    }
  }

  private static applyMoveOperation(
    current: Record<string, unknown> | unknown[],
    lastKey: string,
    patch: MovePatch
  ): void {
    if (!Array.isArray(current))
      throw new Error("Move operation can only be applied to arrays");
    if (patch.index === undefined || patch.value === undefined)
      throw new Error("Move operation requires both from and to indices");

    const fromIndex = patch.value as number;
    const toIndex = patch.index;

    if (fromIndex < 0 || fromIndex >= current.length)
      throw new Error(`From index out of bounds: ${fromIndex}`);
    if (toIndex < 0 || toIndex > current.length)
      throw new Error(`To index out of bounds: ${toIndex}`);

    const [item] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, item);
  }

  static calculateInversePatches(
    document: DesignDocument,
    patches: Patch[]
  ): Patch[] {
    return patches.map((patch) => {
      const current = this.resolveCurrentValue(document, patch.path);

      switch (patch.op) {
        case "add":
          return createRemovePatch(patch.path, patch.value, patch.index);
        case "remove":
          return createAddPatch(patch.path, current, patch.index);
        case "replace":
          return createReplacePatch(patch.path, current, patch.value);
        case "move":
          if (patch.index !== undefined && typeof patch.value === "number") {
            return createMovePatch(patch.path, patch.index, patch.value);
          }
          return { ...patch };
        default:
          throw new Error(`Unknown patch operation: ${(patch as Patch).op}`);
      }
    });
  }

  private static resolveCurrentValue(
    document: DesignDocument,
    path: string[]
  ): unknown {
    let current: PatchTarget = document;
    for (const key of path) {
      if (typeof current !== "object" || current === null) break;
      current = (current as Record<string, unknown>)[key] as PatchTarget;
    }
    return current;
  }

  static validatePatch(document: DesignDocument, patch: Patch): boolean {
    try {
      const clone = deepClone(document);
      this.applySinglePatch(clone, patch);
      return true;
    } catch {
      return false;
    }
  }

  static squashPatches(patches: Patch[]): Patch[] {
    if (patches.length <= 1) return patches;
    const squashed: Patch[] = [];
    let current = patches[0];

    for (let i = 1; i < patches.length; i++) {
      const next = patches[i];
      if (
        current.op === next.op &&
        JSON.stringify(current.path) === JSON.stringify(next.path)
      ) {
        if (current.op === "replace") current = next;
        else {
          squashed.push(current);
          current = next;
        }
      } else {
        squashed.push(current);
        current = next;
      }
    }
    squashed.push(current);
    return squashed;
  }
}

export function createAddPatch(
  path: string[],
  value: unknown,
  index?: number
): AddPatch {
  validatePath(path);
  return { op: "add", path, value, index };
}

export function createRemovePatch(
  path: string[],
  oldValue?: unknown,
  index?: number
): RemovePatch {
  validatePath(path);
  return { op: "remove", path, oldValue, index };
}

export function createReplacePatch(
  path: string[],
  value: unknown,
  oldValue?: unknown
): ReplacePatch {
  validatePath(path);
  return { op: "replace", path, value, oldValue };
}

export function createMovePatch(
  path: string[],
  fromIndex: number,
  toIndex: number
): MovePatch {
  validatePath(path);
  return { op: "move", path, value: fromIndex, index: toIndex };
}

function validatePath(path: string[]): void {
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error("Path must be a non-empty array");
  }
}
