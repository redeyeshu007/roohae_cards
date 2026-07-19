/**
 * The design document format persisted for templates and projects.
 *
 * Editor-agnostic on purpose: Fabric.js is an implementation detail of the
 * Editor SDK. Objects are stored as Fabric-serializable JSON plus Roohae
 * extensions (id, name, editable, assetId, locked, hidden).
 *
 * Binary assets are NEVER embedded — objects reference assets by `assetId`
 * and the SDK resolves them to URLs at load time.
 */

export interface DesignObject {
  /** Stable object id, unique within a page. */
  id: string;
  /** Fabric object type: textbox, rect, circle, image, path, group, ... */
  type: string;
  /** Layer name shown in the Layers panel. */
  name: string;
  /** Whether end users may select/modify this object. Admin-controlled. */
  editable: boolean;
  /** Locked in the editor (admin editing convenience; separate from `editable`). */
  locked: boolean;
  hidden: boolean;
  /** Set for image/video objects; resolved to the original asset URL at load. */
  assetId?: string;
  /** Placeholder label shown in the user editor's Images panel ("Profile Photo"). */
  placeholderName?: string;
  /**
   * Admin-curated gallery for this placeholder: users may swap the image to
   * any of these library asset ids ("Choose From Gallery").
   */
  allowedAssetIds?: string[];
  /**
   * Whether users may upload their OWN replacement image for this
   * placeholder. Undefined = true (back-compat with older documents).
   */
  allowCustomUpload?: boolean;
  /** Allowed replacement extensions (defaults to REPLACEMENT_ACCEPT). */
  accept?: string[];
  /** Max replacement size in megabytes (defaults to REPLACEMENT_MAX_MB). */
  maxSizeMB?: number;
  /** Set when an end user replaced this image in their project copy. */
  userReplaced?: boolean;
  /** Remaining Fabric serialization payload (left/top/scale/fill/text/...). */
  [key: string]: unknown;
}

export interface DesignPage {
  id: string;
  name: string;
  background: string;
  /** Optional background image asset. */
  backgroundAssetId?: string;
  /** Original PDF document asset used to generate this page, when imported. */
  sourcePdfAssetId?: string;
  /** 1-based page number inside the original PDF, when imported. */
  sourcePdfPageNumber?: number;
  /** Rendered page preview dimensions in pixels, when imported. */
  sourcePdfPreview?: { assetId: string; width?: number; height?: number };
  objects: DesignObject[];
}

export interface DesignDocument {
  version: 1;
  /** Canvas size in pixels (already resolved from category unit at 300 DPI for print). */
  width: number;
  height: number;
  pages: DesignPage[];
}

export function createEmptyDocument(width: number, height: number): DesignDocument {
  return {
    version: 1,
    width,
    height,
    pages: [
      {
        id: crypto.randomUUID(),
        name: 'Page 1',
        background: '#ffffff',
        objects: [],
      },
    ],
  };
}

/**
 * Collect every assetId referenced anywhere in a document — including each
 * placeholder's allowed-replacement gallery, so galleries resolve and
 * prefetch through the same pipeline as placed images.
 */
export function collectAssetIds(doc: DesignDocument): string[] {
  const ids = new Set<string>();
  for (const page of doc.pages) {
    if (page.backgroundAssetId) ids.add(page.backgroundAssetId);
    const walk = (objects: DesignObject[]) => {
      for (const obj of objects) {
        if (obj.assetId) ids.add(obj.assetId);
        if (Array.isArray(obj.allowedAssetIds)) {
          for (const id of obj.allowedAssetIds) ids.add(id);
        }
        const children = (obj as { objects?: unknown }).objects;
        if (Array.isArray(children)) walk(children as DesignObject[]);
      }
    };
    walk(page.objects);
  }
  return [...ids];
}

/** Collect every fontFamily referenced by text objects in a document. */
export function collectFontFamilies(doc: DesignDocument): string[] {
  const families = new Set<string>();
  for (const page of doc.pages) {
    const walk = (objects: DesignObject[]) => {
      for (const obj of objects) {
        const family = (obj as { fontFamily?: string }).fontFamily;
        if (family) families.add(family);
        const children = (obj as { objects?: unknown }).objects;
        if (Array.isArray(children)) walk(children as DesignObject[]);
      }
    };
    walk(page.objects);
  }
  return [...families];
}
