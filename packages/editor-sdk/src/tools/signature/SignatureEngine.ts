/**
 * FILE PURPOSE:
 * Digital signature authoring engine for card personalization.
 *
 * MAIN RESPONSIBILITY:
 * Configures decimated smooth PencilBrush rendering with realistic fountain ink coloration,
 * capturing freehand signer signatures and tagging created paths as roohAssetType: 'signature'.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/tools/common/ToolManager.ts (manages signature tool)
 * - packages/ui/src/editor/ToolsPanel.tsx (Tools > Signature tool)
 */

import { PencilBrush, Shadow } from 'fabric';
import { BaseTool, ToolContext } from '../common/BaseTool';

export interface SignatureConfig {
  color: string;
  thickness: number;
  opacity: number;
}

// TOOL: SIGNATURE ENGINE
// Captures smooth calligraphic signatures using decimated path strokes.
export class SignatureEngine extends BaseTool {

  private config: SignatureConfig = {
    color: '#000088', // typical ink color
    thickness: 3,
    opacity: 1,
  };

  private boundOnPathCreated: (e: any) => void;

  constructor(context: ToolContext) {
    super('signature', context);
    this.boundOnPathCreated = this.onPathCreated.bind(this);
  }

  activate(config?: any): void {
    this.canvas.isDrawingMode = true;
    this.updateBrush();
    this.canvas.on('path:created', this.boundOnPathCreated);
  }

  deactivate(): void {
    this.canvas.isDrawingMode = false;
    this.canvas.off('path:created', this.boundOnPathCreated);
  }

  setConfig(config: Partial<SignatureConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.canvas.isDrawingMode) {
      this.updateBrush();
    }
  }

  private updateBrush(): void {
    const brush = new PencilBrush(this.canvas);
    brush.color = this.config.color;
    brush.width = this.config.thickness;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    brush.decimate = 1.5; // smooth paths
    this.canvas.freeDrawingBrush = brush;
  }

  private onPathCreated(e: any): void {
    const path = e.path;
    path.set({
      roohAssetType: 'signature',
      opacity: this.config.opacity,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    });
    this.editor.commit();
  }
}
