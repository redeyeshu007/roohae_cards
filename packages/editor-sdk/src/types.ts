import type { DesignDocument, DesignPage } from '@roohae/shared';

export type EditorMode = 'admin' | 'user';

export type ShapeKind =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'polygon'
  | 'heart'
  | 'arrow'
  | 'line';

export type TextPreset = 'heading' | 'subheading' | 'body';

/** Editor-agnostic snapshot of the selected object(s), consumed by the properties panel. */
export interface SelectionState {
  ids: string[];
  /** Present when exactly one object is selected. */
  object?: ObjectSnapshot;
  count: number;
}

export interface ObjectSnapshot {
  id: string;
  type: string;
  name: string;
  editable: boolean;
  locked: boolean;
  hidden: boolean;
  assetId?: string;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[] | null;
  rx?: number;
  backgroundColor?: string;
  roohAssetType?: string;
  roohBorderPadding?: number;
  // tool-specific
  roohToolType?: 'draw' | 'shape' | 'pen' | 'sticky' | 'wordart' | 'signature' | 'qrcode';
  roohShapeType?: string;
  roohDrawStyle?: string;
  roohSignatureStyle?: string;
  roohQRContent?: string;
  roohWordArtStyle?: string;
  // text-specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  underline?: boolean;
  textAlign?: string;
  charSpacing?: number;
  lineHeight?: number;
  uppercase?: boolean;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
  /** Image placeholder label (admin-authored, shown in the user Images panel). */
  placeholderName?: string;
  /** Admin-curated replacement gallery for this image placeholder. */
  allowedAssetIds?: string[];
  /** Whether users may upload their own replacement (undefined = true). */
  allowCustomUpload?: boolean;
}

/** An image object exposed to the user editor's Editable Images panel. */
export interface ImagePlaceholder {
  id: string;
  /** placeholderName if set, otherwise the layer name. */
  label: string;
  editable: boolean;
  assetId?: string;
  /** Current image source URL — used for the card thumbnail. */
  src?: string;
  /** True once the user replaced this image in their project copy. */
  replaced: boolean;
  selected: boolean;
  accept?: string[];
  maxSizeMB?: number;
  /** Admin-curated gallery the user may choose from. */
  allowedAssetIds: string[];
  /** Whether this placeholder accepts the user's own uploads. */
  allowCustomUpload: boolean;
}

export type ImageReplacementFit = 'stretch' | 'contain';

/** User customization field exposed only when an object is admin-marked editable. */
export interface EditableField {
  id: string;
  label: string;
  type: string;
  value?: string;
  multiline: boolean;
  selected: boolean;
}

/** Flat layer entry for the Layers panel (top-most first). */
export interface LayerEntry {
  id: string;
  name: string;
  type: string;
  editable: boolean;
  locked: boolean;
  hidden: boolean;
  selected: boolean;
}

export interface PageEntry {
  id: string;
  name: string;
  index: number;
  active: boolean;
}

export interface EditorEvents {
  /** Fired after any change that dirties the document (for autosave). */
  'document:change': void;
  'selection:change': SelectionState;
  'layers:change': LayerEntry[];
  'pages:change': PageEntry[];
  'zoom:change': number;
  'history:change': { canUndo: boolean; canRedo: boolean };
  'loading:change': boolean;
}

export interface EditorOptions {
  /** Admin editor: everything selectable. User editor: `editable:false` objects are inert. */
  mode: EditorMode;
  document: DesignDocument;
  /** Resolve an assetId to a loadable URL (always the ORIGINAL asset). */
  resolveAsset: (assetId: string) => string | undefined;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf';
  /** Page indexes to export; defaults to all. */
  pages?: number[];
  /** Extra resolution multiplier on top of the document's native pixel size. */
  scale?: number;
  fileName?: string;
}

export type { DesignDocument, DesignPage };
