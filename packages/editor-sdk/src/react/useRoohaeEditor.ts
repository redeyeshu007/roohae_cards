'use client';

/**
 * FILE PURPOSE:
 * React hook encapsulation for the RoohaeEditor engine lifecycle.
 *
 * MAIN RESPONSIBILITY:
 * Mounts the Fabric canvas instance, wires bi-directional event synchronization
 * into reactive React state (selection, layers, pages, zoom, history), handles StrictMode cleanups,
 * and exposes debounced autosave triggers.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/EditorWorkspace.tsx (calls useRoohaeEditor to bind canvas)
 * - packages/editor-sdk/src/RoohaeEditor.ts (instantiated and managed by this hook)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesignDocument } from '@roohae/shared';
import { RoohaeEditor } from '../RoohaeEditor';
import type {
  EditorMode,
  LayerEntry,
  PageEntry,
  SelectionState,
} from '../types';


export interface UseRoohaeEditorArgs {
  mode: EditorMode;
  document: DesignDocument | undefined;
  resolveAsset: (assetId: string) => string | undefined;
  /** Debounced document-change callback (autosave hook point). */
  onDocumentChange?: () => void;
}

export interface UseRoohaeEditorResult {
  /** Attach to the <canvas> element. */
  canvasRef: (el: HTMLCanvasElement | null) => void;
  editor: RoohaeEditor | null;
  ready: boolean;
  selection: SelectionState;
  layers: LayerEntry[];
  pages: PageEntry[];
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
}

const EMPTY_SELECTION: SelectionState = { ids: [], count: 0 };

/** Pending teardown per canvas element, so a remount waits for the previous
 *  instance to fully dispose (Fabric v6 disposal is async; React StrictMode
 *  mounts → unmounts → remounts on the same element). */
type ElWithCleanup = HTMLCanvasElement & { __roohaeCleanup?: Promise<void> };

/**
 * React binding for the Editor SDK. Owns the editor lifecycle and mirrors
 * SDK events into React state so components stay declarative.
 */
export function useRoohaeEditor(args: UseRoohaeEditorArgs): UseRoohaeEditorResult {
  const { mode, document: designDocument, resolveAsset, onDocumentChange } = args;

  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [editor, setEditor] = useState<RoohaeEditor | null>(null);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

  const changeCbRef = useRef(onDocumentChange);
  changeCbRef.current = onDocumentChange;
  const resolveRef = useRef(resolveAsset);
  resolveRef.current = resolveAsset;
  // Latest document without retriggering the effect — refetches must not
  // recreate the editor mid-editing; only the first arrival matters.
  const documentRef = useRef(designDocument);
  documentRef.current = designDocument;

  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    setCanvasEl(el);
  }, []);

  const hasDocument = designDocument !== undefined;

  useEffect(() => {
    if (!canvasEl || !hasDocument) return;

    const el = canvasEl as ElWithCleanup;
    let cancelled = false;
    let instance: RoohaeEditor | null = null;

    const setup = (async () => {
      // Wait for any previous editor on this element to finish disposing.
      await el.__roohaeCleanup;
      const doc = documentRef.current;
      if (cancelled || !doc) return;

      // EDITOR CANVAS:
      // Initializes the existing design canvas used by Roohae Editor.
      instance = new RoohaeEditor(el, {
        mode,
        document: doc,
        resolveAsset: (id) => resolveRef.current(id),
      });

      // SELECTION:
      // Handles the currently selected canvas object and mirrors changes into React state.
      instance.on('selection:change', setSelection);
      instance.on('layers:change', setLayers);
      instance.on('pages:change', setPages);
      instance.on('zoom:change', setZoom);
      // HISTORY:
      // Tracks canUndo/canRedo flags from HistoryManager to enable/disable TopBar buttons.
      instance.on('history:change', setHistory);
      // AUTOSAVE TRIGGER:
      // Dispatches debounced document modification notification to consumer pages.
      instance.on('document:change', () => changeCbRef.current?.());

      await instance.init();
      if (cancelled) return;
      setEditor(instance);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      setEditor(null);
      setReady(false);
      setSelection(EMPTY_SELECTION);
      el.__roohaeCleanup = setup
        .then(() => instance?.destroyAsync())
        .catch(() => undefined);
    };
  }, [canvasEl, hasDocument, mode]);

  return {
    canvasRef,
    editor,
    ready,
    selection,
    layers,
    pages,
    zoom,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
