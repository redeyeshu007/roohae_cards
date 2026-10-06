/**
 * FILE PURPOSE:
 * Type declarations for freehand drawing brushes in the Roohae Draw Engine.
 *
 * MAIN RESPONSIBILITY:
 * Defines the union of supported freehand drawing tool identifiers.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/draw/* (brush implementations)
 * - packages/ui/src/editor/ToolsPanel.tsx (draw tool selection buttons)
 */

// DRAW BRUSH ENUMERATION:
// Supported brush styles for freehand drawing engine.
export type DrawBrushType = 'pencil' | 'pen' | 'marker' | 'highlighter' | 'brush' | 'chalk' | 'spray' | 'eraser';

