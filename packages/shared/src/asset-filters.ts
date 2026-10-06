/**
 * FILE PURPOSE:
 * Asset filtering and taxonomy classification utilities.
 *
 * MAIN RESPONSIBILITY:
 * Provides predicates and matching functions to filter uploaded assets
 * into images, icons, or global groups for UI asset selector panels.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/LeftSidebar.tsx (filters assets shown in Images vs Elements tabs)
 * - packages/ui/src/editor/ToolsPanel.tsx (filters SVG borders and line assets)
 */

import type { Asset } from './types/entities';
import {
  IMAGE_MIME_TYPES,
} from './constants';

export type AssetPanelType = 'all' | 'images' | 'icons';

// FAST LOOKUP SET:
// Set of accepted raster and vector image MIME types.
const IMAGE_SET = new Set<string>(IMAGE_MIME_TYPES);

// PREDICATE: IMAGE ASSET
// Checks if the asset MIME type matches standard images (PNG, JPEG, SVG, WebP, GIF).
export function isImageAsset(asset: Pick<Asset, 'mimeType'>): boolean {
  return IMAGE_SET.has(asset.mimeType);
}

// PREDICATE: ICON ASSET
// Identifies vector icons by SVG MIME type or explicit 'icon' asset kind.
export function isIconAsset(asset: Pick<Asset, 'mimeType' | 'kind'>): boolean {
  return asset.mimeType === 'image/svg+xml' || asset.kind === 'icon';
}

// FILTER HELPER:
// Evaluates whether an asset should be displayed in the specified UI sidebar tab.
export function assetMatchesPanel(asset: Asset, panel: AssetPanelType): boolean {
  switch (panel) {
    case 'images':
      return isImageAsset(asset) && !isIconAsset(asset);
    case 'icons':
      return isIconAsset(asset);
    case 'all':
      return true;
  }
}
