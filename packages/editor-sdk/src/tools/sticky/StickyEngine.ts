/**
 * FILE PURPOSE:
 * Sticky Note generator engine with custom rounded card backgrounds.
 *
 * MAIN RESPONSIBILITY:
 * Creates editable note card Textbox objects with customized rounded background canvas rendering,
 * pastel color schemes, and standardized handle aesthetics.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/RoohaeEditor.ts (calls StickyEngine.createStickyNote)
 * - packages/ui/src/editor/ToolsPanel.tsx (Tools > Sticky Notes tool)
 */

import { Group, Rect, Textbox, FabricObject } from 'fabric';

export interface StickyOptions {
  width?: number;
  height?: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

// TOOL: STICKY NOTE ENGINE
// Instantiates memo note card elements with rounded background rendering.
export class StickyEngine {

  static createStickyNote(options: StickyOptions = {}): Textbox {
    const width = options.width || 200;
    
    const text = new Textbox(options.text || 'Note', {
      width,
      fontSize: options.fontSize || 20,
      fontFamily: options.fontFamily || 'Inter',
      fill: options.textColor || '#000000',
      backgroundColor: options.backgroundColor || '#fef08a',
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      splitByGrapheme: true,
      roohAssetType: 'sticky',
      padding: 20,
      
      // Custom selection styling to match the project's aesthetics
      transparentCorners: false,
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#94A3B8',
      borderColor: '#8B5CF6',
      cornerSize: 12,
      cornerStyle: 'circle',
      borderScaleFactor: 2.5,
    } as any);

    // Override the background rendering to support rounded corners
    (text as any)._renderBackground = function(ctx: CanvasRenderingContext2D) {
      if (!this.backgroundColor) return;
      const w = this.width + (this.padding * 2);
      const h = this.height + (this.padding * 2);
      const x = -this.width / 2 - this.padding;
      const y = -this.height / 2 - this.padding;
      const rx = 8;
      
      ctx.fillStyle = this.backgroundColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, rx);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fill();
    };

    return text;
  }
}
