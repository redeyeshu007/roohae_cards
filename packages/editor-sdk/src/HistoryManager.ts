/**
 * FILE PURPOSE:
 * Undo/Redo history stack manager for canvas design pages.
 *
 * MAIN RESPONSIBILITY:
 * Maintains bounded stacks of deep-cloned page state snapshots,
 * handling undo, redo, and operation suspension (e.g., during page loading or batch operations).
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/RoohaeEditor.ts (calls push, undo, redo, reset)
 * - packages/ui/src/editor/TopBar.tsx (Undo/Redo button controls wired to history)
 */

import type { DesignPage } from '@roohae/shared';

// MAX STACK SIZE:
// Maximum number of reversible snapshots preserved before oldest states are discarded.
const MAX_HISTORY = 60;

/**
 * Snapshot-based undo/redo for the active page. Snapshots are structural
 * clones of the serialized page — cheap relative to canvas re-render cost
 * and immune to fabric internal state drift.
 */
// HISTORY ENGINE:
// Manages page snapshot stacks for non-destructive state rollbacks and reapplications.
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

  // HISTORY:
  // Reverts to the previous snapshot on the undo stack and moves current state to redo stack.
  // Called by: editor.undo() in response to TopBar Undo button or Ctrl+Z shortcut.
  undo(current: DesignPage): DesignPage | undefined {
    if (!this.canUndo) return undefined;
    const popped = this.undoStack.pop()!;
    this.redoStack.push(structuredClone(current ?? popped));
    return structuredClone(this.undoStack[this.undoStack.length - 1]!);
  }

  // HISTORY:
  // Restores the next forward snapshot from the redo stack and moves it back onto undo stack.
  // Called by: editor.redo() in response to TopBar Redo button or Ctrl+Y shortcut.
  redo(): DesignPage | undefined {
    const next = this.redoStack.pop();
    if (!next) return undefined;
    this.undoStack.push(structuredClone(next));
    return structuredClone(next);
  }
}
