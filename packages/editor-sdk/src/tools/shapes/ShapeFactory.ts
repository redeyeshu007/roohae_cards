import {
  Rect,
  Circle,
  Triangle,
  Ellipse,
  Polygon,
  FabricObject,
  Point,
} from 'fabric';

export interface ShapeOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  radius?: number;
}

export class ShapeFactory {
  static createRectangle(options: ShapeOptions = {}): Rect {
    const rect = new Rect({
      width: options.width || 100,
      height: options.height || 100,
      fill: options.fill || '#e0e0e0',
      stroke: options.stroke || null,
      strokeWidth: options.strokeWidth || 0,
      roohAssetType: 'shape',
      roohShapeType: 'rectangle',
    } as any);
    return rect;
  }

  static createRoundedRectangle(options: ShapeOptions = {}): Rect {
    const rect = new Rect({
      width: options.width || 100,
      height: options.height || 100,
      rx: options.radius || 20,
      ry: options.radius || 20,
      fill: options.fill || '#e0e0e0',
      stroke: options.stroke || null,
      strokeWidth: options.strokeWidth || 0,
      roohAssetType: 'shape',
      roohShapeType: 'rounded-rectangle',
    } as any);
    return rect;
  }

  static createCircle(options: ShapeOptions = {}): Circle {
    const circle = new Circle({
      radius: options.radius || 50,
      fill: options.fill || '#e0e0e0',
      stroke: options.stroke || null,
      strokeWidth: options.strokeWidth || 0,
      roohAssetType: 'shape',
      roohShapeType: 'circle',
    } as any);
    return circle;
  }

  static createTriangle(options: ShapeOptions = {}): Triangle {
    const triangle = new Triangle({
      width: options.width || 100,
      height: options.height || 100,
      fill: options.fill || '#e0e0e0',
      stroke: options.stroke || null,
      strokeWidth: options.strokeWidth || 0,
      roohAssetType: 'shape',
      roohShapeType: 'triangle',
    } as any);
    return triangle;
  }

  static createEllipse(options: ShapeOptions = {}): Ellipse {
    const ellipse = new Ellipse({
      rx: (options.width || 100) / 2,
      ry: (options.height || 60) / 2,
      fill: options.fill || '#e0e0e0',
      stroke: options.stroke || null,
      strokeWidth: options.strokeWidth || 0,
      roohAssetType: 'shape',
      roohShapeType: 'ellipse',
    } as any);
    return ellipse;
  }

  static createStar(options: ShapeOptions = {}): Polygon {
    // Generate star polygon points
    const spikes = 5;
    const outerRadius = (options.width || 100) / 2;
    const innerRadius = outerRadius / 2;
    const points: Point[] = [];
    
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    for (let i = 0; i < spikes; i++) {
      points.push(new Point(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius));
      rot += step;
      points.push(new Point(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius));
      rot += step;
    }

    const star = new Polygon(points, {
      fill: options.fill || '#e0e0e0',
      stroke: options.stroke || null,
      strokeWidth: options.strokeWidth || 0,
      roohAssetType: 'shape',
      roohShapeType: 'star',
    } as any);
    return star;
  }

  // Add more shapes as needed (Heart, Arrow, Speech Bubble, etc.)
}
