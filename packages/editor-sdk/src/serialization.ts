import type { FabricObject } from 'fabric';
import type { DesignObject, DesignPage } from '@roohae/shared';

/**
 * Roohae extensions persisted alongside Fabric's own serialization.
 * `uppercase`/`rawText` implement Canva-style case transform; `rawText`
 * preserves the author's original casing.
 */
/**
 * NOTE: the document format's `editable` flag is stored on fabric objects as
 * `roohEditable` to avoid colliding with fabric's own Textbox.editable
 * (which controls inline text editing).
 */
export const CUSTOM_PROPS = [
  'id',
  'name',
  'roohEditable',
  'locked',
  'hidden',
  'assetId',
  'uppercase',
  'rawText',
  // image placeholder system
  'placeholderName',
  'allowedAssetIds',
  'allowCustomUpload',
  'accept',
  'maxSizeMB',
  'userReplaced',
] as const;

export function newObjectId(): string {
  return crypto.randomUUID();
}

/** Serialize a fabric object into a portable DesignObject. */
export function toDesignObject(obj: FabricObject): DesignObject {
  const json = obj.toObject([...CUSTOM_PROPS]) as Record<string, unknown>;
  const design = json as unknown as DesignObject;

  design.id ||= newObjectId();
  design.name ||= defaultName(String(json.type ?? 'object'));
  design.editable = Boolean(json.roohEditable);
  delete (design as Record<string, unknown>).roohEditable;
  design.locked = Boolean(json.locked);
  design.hidden = Boolean(json.hidden);

  // Documents must stay portable: images referenced by assetId drop their
  // resolved URL — it is re-resolved from the asset service at load time.
  if (design.assetId && 'src' in design) {
    delete (design as Record<string, unknown>).src;
  }
  return design;
}

/**
 * Build the Fabric-consumable JSON for a page, resolving assetIds to
 * original-resolution URLs.
 */
export function pageToFabricJSON(
  page: DesignPage,
  resolveAsset: (assetId: string) => string | undefined,
): Record<string, unknown> {
  const objects = page.objects.map((obj) => {
    const { editable, ...rest } = obj;
    const runtime: Record<string, unknown> = { ...rest, roohEditable: editable };
    if (obj.assetId) {
      const src = resolveAsset(obj.assetId);
      if (src) {
        runtime.src = src;
        runtime.crossOrigin = 'anonymous';
      }
    }
    return runtime;
  });
  return {
    version: '6.0.0',
    background: page.background,
    backgroundAssetId: page.backgroundAssetId,
    backgroundImageSettings: page.backgroundImageSettings,
    objects,
  };
}

export function defaultName(type: string): string {
  const names: Record<string, string> = {
    textbox: 'Text',
    'i-text': 'Text',
    rect: 'Rectangle',
    circle: 'Circle',
    triangle: 'Triangle',
    polygon: 'Polygon',
    line: 'Line',
    path: 'Path',
    image: 'Image',
    group: 'Group',
  };
  return names[type.toLowerCase()] ?? 'Object';
}
