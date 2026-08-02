import { FabricImage, FabricObject } from 'fabric';

export interface QRCodeOptions {
  content?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  margin?: number;
}

export class QRCodeEngine {
  static async createQRCode(options: QRCodeOptions = {}): Promise<FabricObject> {
    const content = options.content || 'https://roohae.com';
    const fg = (options.foregroundColor || '#000000').replace('#', '');
    const bg = (options.backgroundColor || '#ffffff').replace('#', '');
    const margin = options.margin || 1;

    // Using a public API for zero-dependency QR code generation
    // In production, a local library like `qrcode` should be used.
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}&color=${fg}&bgcolor=${bg}&margin=${margin}`;

    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    img.set({
      roohAssetType: 'qrcode',
      roohQRContent: content,
    });
    
    return img;
  }
}
