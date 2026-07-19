import type { DesignPage } from '@roohae/shared';

const MAX_HISTORY = 60;

/**
 * Snapshot-based undo/redo for the active page. Snapshots are structural
 * clones of the serialized page — cheap relative to canvas re-render cost
 * and immune to fabric internal state drift.
 */
export class HistoryManager {
  private undoStack: DesignPage[] = [];
  private redoStack: DesignPage[] = [];
  private suspended = false;

  get canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Run fn without recording snapshots (e.g. while loading a page). */
  suspend<T>(fn: () => T): T {
    this.suspended = true;
    try {
      return fn();
    } finally {
      this.suspended = false;
    }
  }

  reset(initial: DesignPage): void {
    this.undoStack = [structuredClone(initial)];
    this.redoStack = [];
  }

  push(snapshot: DesignPage): void {
    if (this.suspended) return;
    this.undoStack.push(structuredClone(snapshot));
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(current: DesignPage): DesignPage | undefined {
    if (!this.canUndo) return undefined;
    const popped = this.undoStack.pop()!;
    this.redoStack.push(structuredClone(current ?? popped));
    return structuredClone(this.undoStack[this.undoStack.length - 1]!);
  }

  redo(): DesignPage | undefined {
    const next = this.redoStack.pop();
    if (!next) return undefined;
    this.undoStack.push(structuredClone(next));
    return structuredClone(next);
  }
}
