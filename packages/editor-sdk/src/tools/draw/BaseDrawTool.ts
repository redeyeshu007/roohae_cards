import { BaseBrush } from 'fabric';
import { BaseTool, ToolContext } from '../common/BaseTool';

export interface DrawConfig {
  color: string;
  thickness: number;
  opacity: number;
  density?: number;
  hardness?: number;
  flow?: number;
  scatter?: number;
  particleSize?: number;
  texture?: string;
}

export abstract class BaseDrawTool extends BaseTool {
  public config: DrawConfig = {
    color: '#000000',
    thickness: 5,
    opacity: 1,
  };

  protected boundOnMouseDown: (e: any) => void;
  protected boundOnMouseMove: (e: any) => void;
  protected boundOnMouseUp: (e: any) => void;

  constructor(id: string, context: ToolContext) {
    super(id, context);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
  }

  activate(config?: Partial<DrawConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    // Canva-style: disable ALL object selection and target finding during draw mode
    this.canvas.selection = false;
    (this.canvas as any).skipTargetFind = true;
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.discardActiveObject();
    
    // Make every existing object non-interactive so clicks pass through to drawing
    this.canvas.forEachObject((obj: any) => {
      if (obj._drawModePrevSelectable === undefined) {
        obj._drawModePrevSelectable = obj.selectable;
        obj._drawModePrevEvented = obj.evented;
      }
      obj.selectable = false;
      obj.evented = false;
      obj.hasControls = false;
      obj.hasBorders = false;
    });
    this.canvas.on('mouse:down', this.boundOnMouseDown);
    this.canvas.on('mouse:move', this.boundOnMouseMove);
    this.canvas.on('mouse:up', this.boundOnMouseUp);
    this.canvas.requestRenderAll();
    this.onActivate();
  }

  deactivate(): void {
    this.canvas.selection = true;
    (this.canvas as any).skipTargetFind = false;
    this.canvas.defaultCursor = 'default';
    
    // Restore selectability for non-draw objects when leaving draw mode
    this.canvas.forEachObject((obj: any) => {
      const isDraw = obj.roohAssetType === 'draw' || !!obj.roohDrawStyle;
      if (isDraw) {
        obj.selectable = false;
        obj.evented = false;
        obj.hasControls = false;
        obj.hasBorders = false;
      } else if (obj._drawModePrevSelectable !== undefined) {
        obj.selectable = obj._drawModePrevSelectable;
        obj.evented = obj._drawModePrevEvented;
        delete obj._drawModePrevSelectable;
        delete obj._drawModePrevEvented;
      } else {
        // Objects created during draw mode — make them selectable now if not draw strokes
        obj.selectable = true;
        obj.evented = true;
        obj.hasControls = true;
        obj.hasBorders = true;
      }
    });
    this.canvas.off('mouse:down', this.boundOnMouseDown);
    this.canvas.off('mouse:move', this.boundOnMouseMove);
    this.canvas.off('mouse:up', this.boundOnMouseUp);
    this.canvas.requestRenderAll();
    this.onDeactivate();
  }

  updateProperties(config: Partial<DrawConfig>): void {
    this.config = { ...this.config, ...config };
    this.onConfigChange();
  }

  getConfig(): DrawConfig {
    return { ...this.config };
  }

  // Lifecycle hooks for engines
  protected onActivate(): void {}
  protected onDeactivate(): void {}
  protected onConfigChange(): void {}

  // Internal event handlers routing to abstract pointer methods
  private onMouseDown(e: any): void {
    this.pointerDown(e);
  }

  private onMouseMove(e: any): void {
    this.pointerMove(e);
  }

  private onMouseUp(e: any): void {
    this.pointerUp(e);
  }

  // Hook methods for manual stroke handling
  protected abstract pointerDown(e: any): void;
  protected abstract pointerMove(e: any): void;
  protected abstract pointerUp(e: any): void;

  // Utility to format paths created by subclasses
  protected formatPath(path: any): void {
    path.set({
      roohAssetType: 'draw',
      roohDrawStyle: this.id, // e.g. 'draw-pencil'
      opacity: this.config.opacity,
    });
  }
}
