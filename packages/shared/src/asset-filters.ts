import type { Asset } from './types/entities';
import {
  IMAGE_MIME_TYPES,
} from './constants';

export type AssetPanelType = 'all' | 'images' | 'icons';

const IMAGE_SET = new Set<string>(IMAGE_MIME_TYPES);

export function isImageAsset(asset: Pick<Asset, 'mimeType'>): boolean {
  return IMAGE_SET.has(asset.mimeType);
}

export function isIconAsset(asset: Pick<Asset, 'mimeType' | 'kind'>): boolean {
  return asset.mimeType === 'image/svg+xml' || asset.kind === 'icon';
}

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
