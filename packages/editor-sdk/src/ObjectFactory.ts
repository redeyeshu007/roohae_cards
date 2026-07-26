import {
  Circle,
  FabricImage,
  Line,
  Path,
  Polygon,
  Rect,
  Textbox,
  Triangle,
  loadSVGFromURL,
  util,
  type FabricObject,
} from 'fabric';
import { defaultName, newObjectId } from './serialization';
import type { ShapeKind, TextPreset } from './types';

const DEFAULT_FILL = '#6366f1';

function starPoints(spikes: number, outer: number, inner: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return points;
}

const HEART_PATH =
  'M 272.7 238.9 C 206.4 152.9 74 171.5 74 288.6 C 74 366.7 141.2 425.6 272.7 528 C 404.2 425.6 471.4 366.7 471.4 288.6 C 471.4 171.5 339 152.9 272.7 238.9 Z';

const ARROW_PATH = 'M 0 35 L 120 35 L 120 10 L 180 50 L 120 90 L 120 65 L 0 65 Z';

function brand(obj: FabricObject, name: string): FabricObject {
  obj.set({ 
    id: newObjectId(), 
    name, 
    roohEditable: false, 
    locked: false, 
    hidden: false,
    // Custom selection styling
    transparentCorners: false,
    cornerColor: '#FFFFFF',
    cornerStrokeColor: '#94A3B8', // Slate grey stroke for handles
    borderColor: '#8B5CF6', // Bright purple border
    cornerSize: 12,
    padding: 8,
    cornerStyle: 'circle',
    borderScaleFactor: 2.5, // Thicker border
  });
  return obj;
}

/** Creates fully-configured fabric objects. The only place object defaults live. */
export class ObjectFactory {
  createText(preset: TextPreset, canvasWidth: number): FabricObject {
    const presets: Record<TextPreset, { text: string; fontSize: number; fontWeight: number }> = {
      heading: { text: 'Add a heading', fontSize: Math.round(canvasWidth / 12), fontWeight: 700 },
      subheading: { text: 'Add a subheading', fontSize: Math.round(canvasWidth / 20), fontWeight: 600 },
      body: { text: 'Add a little bit of body text', fontSize: Math.round(canvasWidth / 32), fontWeight: 400 },
    };
    const cfg = presets[preset];
    const textbox = new Textbox(cfg.text, {
      width: Math.round(canvasWidth * 0.6),
      fontSize: cfg.fontSize,
      fontWeight: cfg.fontWeight,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#1f2937',
      textAlign: 'center',
    });
    return brand(textbox, preset === 'body' ? 'Body text' : preset === 'heading' ? 'Heading' : 'Subheading');
  }

  createShape(kind: ShapeKind, size: number): FabricObject {
    const common = { fill: DEFAULT_FILL, stroke: undefined, strokeWidth: 0 };
    switch (kind) {
      case 'rectangle':
        return brand(new Rect({ ...common, width: size, height: size * 0.75 }), 'Rectangle');
      case 'rounded-rectangle':
        return brand(
          new Rect({ ...common, width: size, height: size * 0.75, rx: size * 0.08, ry: size * 0.08 }),
          'Rounded rectangle',
        );
      case 'circle':
        return brand(new Circle({ ...common, radius: size / 2 }), 'Circle');
      case 'triangle':
        return brand(new Triangle({ ...common, width: size, height: size }), 'Triangle');
      case 'diamond':
        return brand(
          new Polygon(
            [
              { x: 0, y: -size / 2 },
              { x: size / 2, y: 0 },
              { x: 0, y: size / 2 },
              { x: -size / 2, y: 0 },
            ],
            { ...common },
          ),
          'Diamond',
        );
      case 'star':
        return brand(new Polygon(starPoints(5, size / 2, size / 5), { ...common }), 'Star');
      case 'polygon':
        return brand(new Polygon(starPoints(6, size / 2, size / 2), { ...common }), 'Hexagon');
      case 'heart':
        return brand(
          new Path(HEART_PATH, { ...common, scaleX: size / 400, scaleY: size / 400 }),
          'Heart',
        );
      case 'arrow':
        return brand(new Path(ARROW_PATH, { ...common, scaleX: size / 180, scaleY: size / 180 }), 'Arrow');
      case 'line':
        return brand(
          new Line([0, 0, size, 0], { stroke: '#1f2937', strokeWidth: Math.max(2, size / 60) }),
          'Line',
        );
    }
  }

  async createImage(url: string, assetId: string, maxSize: number): Promise<FabricObject> {
    const image = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const scale = Math.min(1, maxSize / Math.max(image.width ?? 1, image.height ?? 1));
    image.set({ scaleX: scale, scaleY: scale, assetId });
    return brand(image, defaultName('image'));
  }

  async createSvg(url: string, type: 'border' | 'line', maxSize: number): Promise<FabricObject> {
    const { objects, options } = await loadSVGFromURL(url);
    const validObjects = objects.filter((o): o is FabricObject => o !== null);
    
    // Slightly reduce border/line boldness by scaling down the stroke width
    if (type === 'border' || type === 'line') {
      validObjects.forEach((obj) => {
        if (obj.strokeWidth !== undefined) {
          obj.strokeWidth = Math.max(0.2, obj.strokeWidth * 0.25);
        }
      });
    }
    
    const svgObj = util.groupSVGElements(validObjects, options);
    
    // Scale SVG to fit canvas
    const scale = Math.min(1, maxSize / Math.max(svgObj.width ?? 1, svgObj.height ?? 1));
    svgObj.set({ scaleX: scale, scaleY: scale });
    
    const name = type === 'border' ? 'Border' : 'Line';
    
    return brand(svgObj, defaultName(name));
  }
}
