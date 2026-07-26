import { StaticCanvas, FabricImage, filters } from 'fabric';
import { PDFDocument } from 'pdf-lib';
import type { DesignDocument, DesignPage } from '@roohae/shared';
import { pageToFabricJSON } from './serialization';
import type { ExportOptions } from './types';

/**
 * Renders design documents at their FULL native resolution on an offscreen
 * canvas — independent of the on-screen zoom — always using original assets.
 * Quality is never reduced: PNG is lossless, JPG at max quality, PDF embeds
 * the losslessly-rendered PNG pages.
 */
/** Downloads and previews auto-upscale small designs to at least this width. */
const AUTO_MIN_WIDTH = 1200;
const MAX_AUTO_SCALE = 6;

export class ExportService {
  constructor(private readonly resolveAsset: (assetId: string) => string | undefined) {}

  /**
   * Scale applied when the caller does not choose one: documents narrower
   * than AUTO_MIN_WIDTH render proportionally larger (same quality as the
   * preview); documents at or above it render at native resolution.
   * Width and height always scale together — aspect ratio is preserved.
   */
  static autoScaleFor(doc: DesignDocument): number {
    return Math.max(1, Math.min(MAX_AUTO_SCALE, AUTO_MIN_WIDTH / doc.width));
  }

  private async renderPage(
    doc: DesignDocument,
    page: DesignPage,
    format: 'png' | 'jpeg',
    scale: number,
  ): Promise<string> {
    const el = document.createElement('canvas');
    const canvas = new StaticCanvas(el, {
      width: doc.width,
      height: doc.height,
      backgroundColor: page.background,
      enableRetinaScaling: false,
    });
    try {
      await canvas.loadFromJSON(pageToFabricJSON(page, this.resolveAsset));
      
      // Explicitly apply background (same logic as RoohaeEditor)
      canvas.backgroundColor = page.background;
      if (page.backgroundAssetId) {
        const url = this.resolveAsset(page.backgroundAssetId);
        if (url) {
          const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
          const settings = page.backgroundImageSettings ?? { fit: 'fill', opacity: 100, blur: 0 };
          
          img.set({ opacity: settings.opacity / 100 });
          
          if (settings.blur > 0) {
            img.filters.push(new filters.Blur({ blur: settings.blur / 20 }));
            img.applyFilters();
          }

          const canvasWidth = doc.width;
          const canvasHeight = doc.height;
          const imgWidth = img.width || 1;
          const imgHeight = img.height || 1;
          
          let scaleX = 1;
          let scaleY = 1;

          switch (settings.fit) {
            case 'fit': {
              const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
              scaleX = scale;
              scaleY = scale;
              break;
            }
            case 'fill': {
              const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
              scaleX = scale;
              scaleY = scale;
              break;
            }
            case 'stretch': {
              scaleX = canvasWidth / imgWidth;
              scaleY = canvasHeight / imgHeight;
              break;
            }
          }

          img.set({
            scaleX,
            scaleY,
            originX: 'center',
            originY: 'center',
            left: canvasWidth / 2,
            top: canvasHeight / 2,
          });
          
          canvas.backgroundImage = img;
        }
      }

      canvas.renderAll();
      return canvas.toDataURL({ format, quality: 1, multiplier: scale });
    } finally {
      void canvas.dispose();
    }
  }

  async export(doc: DesignDocument, options: ExportOptions): Promise<void> {
    const scale = options.scale ?? ExportService.autoScaleFor(doc);
    const pageIndexes = options.pages ?? doc.pages.map((_, i) => i);
    const name = options.fileName ?? 'design';

    if (options.format === 'pdf') {
      const pdf = await PDFDocument.create();
      for (const index of pageIndexes) {
        const page = doc.pages[index];
        if (!page) continue;
        const dataUrl = await this.renderPage(doc, page, 'png', scale);
        const png = await pdf.embedPng(dataUrl);
        // 300 DPI px → 72 pt PDF points, preserving physical dimensions.
        const ptWidth = (doc.width / 300) * 72;
        const ptHeight = (doc.height / 300) * 72;
        const pdfPage = pdf.addPage([ptWidth, ptHeight]);
        pdfPage.drawImage(png, { x: 0, y: 0, width: ptWidth, height: ptHeight });
      }
      const bytes = await pdf.save();
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);
      downloadBlob(new Blob([arrayBuffer], { type: 'application/pdf' }), `${name}.pdf`);
      return;
    }

    const format = options.format === 'jpg' ? 'jpeg' : 'png';
    for (const index of pageIndexes) {
      const page = doc.pages[index];
      if (!page) continue;
      const dataUrl = await this.renderPage(doc, page, format, scale);
      const suffix = pageIndexes.length > 1 ? `-page-${index + 1}` : '';
      downloadDataUrl(dataUrl, `${name}${suffix}.${options.format}`);
    }
  }

  /**
   * Render one page to a data URL (used for previews). Small documents are
   * rendered ABOVE native size so the preview stays crisp — text and shapes
   * are vectors, and images re-render from their originals.
   */
  async preview(doc: DesignDocument, pageIndex: number, maxWidth = 1200): Promise<string> {
    const page = doc.pages[pageIndex];
    if (!page) throw new Error(`Page ${pageIndex} does not exist`);
    const scale = Math.max(ExportService.autoScaleFor(doc), Math.min(MAX_AUTO_SCALE, maxWidth / doc.width));
    return this.renderPage(doc, page, 'png', scale);
  }
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
