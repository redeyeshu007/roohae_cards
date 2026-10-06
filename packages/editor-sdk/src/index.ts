/**
 * FILE PURPOSE:
 * Public entrypoint and barrel export for the Roohae Editor SDK package.
 *
 * MAIN RESPONSIBILITY:
 * Re-exports the core RoohaeEditor engine, BorderLayerManager, ExportService,
 * font utilities, React hooks, and domain type definitions for consumer applications.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui (consumes editor SDK exports)
 * - apps/admin & apps/user (consumes editor SDK exports)
 */

export { RoohaeEditor } from './RoohaeEditor';
export * from './BorderLayerManager';
export { ExportService } from './ExportService';
export { loadFonts } from './fonts';
export { useRoohaeEditor } from './react/useRoohaeEditor';

export type {
  UseRoohaeEditorArgs,
  UseRoohaeEditorResult,
} from './react/useRoohaeEditor';
export type {
  EditableField,
  EditorMode,
  EditorOptions,
  EditorEvents,
  ExportOptions,
  ImagePlaceholder,
  LayerEntry,
  ObjectSnapshot,
  PageEntry,
  SelectionState,
  ShapeKind,
  TextPreset,
} from './types';
export type { DrawBrushType } from './tools/draw/types';
export type { DrawConfig } from './tools/draw/BaseDrawTool';
