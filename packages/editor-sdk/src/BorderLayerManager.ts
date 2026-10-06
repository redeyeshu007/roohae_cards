/**
 * FILE PURPOSE:
 * Roohae Border Engine & PageBorder custom Fabric.js element class.
 *
 * MAIN RESPONSIBILITY:
 * Implements procedural page border generation with mathematically locked geometry.
 * Solves the critical Fabric.js bounding box distortion bug by forcing native strokeWidth = 0
 * and rendering border stroke thickness internally within custom cache and dimensions.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Do NOT set native Fabric strokeWidth > 0 on PageBorder. This would distort selection bounding boxes.
 * 2. Origin is centered: (docWidth / 2, docHeight / 2) with originX: 'center' and originY: 'center'.
 * 3. Padding scales symmetrically: width = docWidth - padding * 2, height = docHeight - padding * 2.
 * 4. Procedural miters: Dashed borders render solid corner squares to guarantee crisp print edges.
 *
 * CONNECTED SYSTEMS:
 * - packages/editor-sdk/src/RoohaeEditor.ts (registers PageBorder class and invokes border actions)
 * - packages/ui/src/editor/ToolsPanel.tsx (Borders & Lines tool UI)
 * - packages/ui/src/editor/PropertiesPanel.tsx (Border thickness, padding, style controls)
 */

import { FabricObject, classRegistry, Point } from 'fabric';
import { defaultName, newObjectId } from './serialization';

export interface BorderStyleConfig {
  padding: number;
  thickness: number;
  strokeColor: string;
  opacity: number;
  style: 'solid' | 'dashed' | 'dotted' | 'decorative';
  dashArray: number[] | null;
}

export class PageBorder extends FabricObject {
  declare roohAssetType: string;
  declare roohBorderPadding: number;
  declare roohBorderThickness: number;

  static override type = 'PageBorder';

  static override cacheProperties = [
    ...FabricObject.cacheProperties,
    'roohBorderPadding',
    'roohBorderThickness'
  ];

  constructor(options: any) {
    // Migration: If loading an old file, convert native strokeWidth to custom thickness
    if (options && options.strokeWidth !== undefined && options.strokeWidth !== 0) {
      if (options.roohBorderThickness === undefined) {
        options.roohBorderThickness = options.strokeWidth;
      }
      options.strokeWidth = 0;
    }

    super(options);
    this.type = 'PageBorder';
    if (this.roohAssetType === undefined) this.roohAssetType = 'border';
    if (this.roohBorderPadding === undefined) this.roohBorderPadding = 0;
    if (this.roohBorderThickness === undefined) this.roohBorderThickness = 0;
    this.strokeWidth = 0; // Absolute safety net
  }

  // Mathematically lock native strokeWidth to 0 at all times
  override _set(key: string, value: any) {
    if (key === 'strokeWidth') {
      return super._set(key, 0);
    }
    return super._set(key, value);
  }

  // Geometry is purely determined by padding/doc bounds.
  // We include stroke thickness so the off-screen cache doesn't clip the outward bleed.
  override _getNonTransformedDimensions() {
    const thickness = this.roohBorderThickness || 0;
    return new Point(this.width + thickness, this.height + thickness);
  }

  // Draw the border physically on the canvas
  override _render(ctx: CanvasRenderingContext2D) {
    const w = this.width;
    const h = this.height;
    const thickness = this.roohBorderThickness || 0;

    const styleArr = this.strokeDashArray;
    const isDotted = styleArr && styleArr.length > 0 && styleArr[0] !== undefined && styleArr[0] < 1;
    const isDashed = styleArr && styleArr.length > 0 && !isDotted;
    const isSolid = !isDashed && !isDotted;

    if (isSolid) {
      ctx.beginPath();
      ctx.strokeStyle = (this.stroke as string) || '#000000';
      ctx.lineWidth = thickness;
      ctx.setLineDash([]);
      ctx.lineCap = 'square';
      if (w > 0 && h > 0) {
        ctx.rect(-w / 2, -h / 2, w, h);
      }
      ctx.stroke();
      return;
    }

    // Procedural Rendering for Dashed and Dotted borders
    ctx.fillStyle = (this.stroke as string) || '#000000';
    const styleType = isDotted ? 'dotted' : 'dashed';

    // Caching layout generation for maximum performance
    if (!(this as any)._patternCache || (this as any)._patternCache.w !== w || (this as any)._patternCache.h !== h || (this as any)._patternCache.type !== styleType) {
      const points: any[] = [];
      
      if (isDashed) {
        const D = 18; // Constant Dash Length
        const targetGap = 10;
        const Kw = Math.max(2, Math.round((w + targetGap) / (D + targetGap)));
        const Kh = Math.max(2, Math.round((h + targetGap) / (D + targetGap)));
        const Gw = Math.max(0, (w - Kw * D) / (Kw - 1)); // Distribute remaining space perfectly
        const Gh = Math.max(0, (h - Kh * D) / (Kh - 1));

        for (let i = 0; i < Kw; i++) {
          points.push({ t: 'h', x: -w/2 + i * (D + Gw), y: -h/2 }); // Top
          points.push({ t: 'h', x: -w/2 + i * (D + Gw), y: h/2 });  // Bottom
        }
        for (let i = 0; i < Kh; i++) {
          points.push({ t: 'v', x: -w/2, y: -h/2 + i * (D + Gh) }); // Left
          points.push({ t: 'v', x: w/2, y: -h/2 + i * (D + Gh) });  // Right
        }
      } else {
        const targetSpacing = 14;
        const Kw = Math.max(2, Math.round(w / targetSpacing) + 1);
        const Kh = Math.max(2, Math.round(h / targetSpacing) + 1);
        const Gw = w / (Kw - 1);
        const Gh = h / (Kh - 1);

        for (let i = 0; i < Kw; i++) {
          points.push({ x: -w/2 + i * Gw, y: -h/2 }); // Top
        }
        for (let i = 1; i < Kh; i++) {
          points.push({ x: w/2, y: -h/2 + i * Gh }); // Right
        }
        for (let i = 0; i < Kw - 1; i++) {
          points.push({ x: -w/2 + i * Gw, y: h/2 }); // Bottom
        }
        for (let i = 1; i < Kh - 1; i++) {
          points.push({ x: -w/2, y: -h/2 + i * Gh }); // Left
        }
      }
      
      (this as any)._patternCache = { w, h, type: styleType, points };
    }

    const cache = (this as any)._patternCache;
    ctx.beginPath();
    
    if (isDashed) {
      const D = 18;
      for (const p of cache.points) {
        if (p.t === 'h') {
          // Horizontal dash: height scales with thickness, length is fixed D
          ctx.rect(p.x, p.y - thickness / 2, D, thickness);
        } else {
          // Vertical dash: width scales with thickness, height is fixed D
          ctx.rect(p.x - thickness / 2, p.y, thickness, D);
        }
      }
      // Fill the 4 outer corner 'bite marks' with perfect squares so they look like solid miters
      const t2 = thickness / 2;
      ctx.rect(-w/2 - t2, -h/2 - t2, t2, t2); // Top-Left
      ctx.rect(w/2, -h/2 - t2, t2, t2);       // Top-Right
      ctx.rect(w/2, h/2, t2, t2);             // Bottom-Right
      ctx.rect(-w/2 - t2, h/2, t2, t2);       // Bottom-Left
    } else {
      const r = Math.max(0.1, thickness / 2);
      for (const p of cache.points) {
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      }
    }
    
    // Draw all independent shapes simultaneously without strokeDashArray overlaps
    ctx.fill();
  }

  override toObject(propertiesToInclude: string[] = []) {
    return super.toObject([
      ...propertiesToInclude,
      'roohAssetType',
      'roohBorderPadding',
      'roohBorderThickness',
    ]);
  }
}

// Register class for serialization and history restore
classRegistry.setClass(PageBorder, 'PageBorder');

// BORDER ENGINE:
// Procedural Border Layer Manager providing factory creation and atomic property updates.
export class BorderLayerManager {
  // BORDER CREATION:
  // Creates a new PageBorder object positioned at the canvas center with custom geometry.
  // Flow: ToolsPanel Borders button → editor.addBorder() → BorderLayerManager.createBorderLayer()
  static createBorderLayer(docWidth: number, docHeight: number, config: BorderStyleConfig): FabricObject {
    const { padding, thickness, strokeColor, opacity, dashArray } = config;

    const w = docWidth - padding * 2;
    const h = docHeight - padding * 2;

    // BORDER OBJECT:
    // PageBorder instance with strokeWidth=0 to prevent Fabric bounding-box drift.
    const border = new PageBorder({
      id: newObjectId(),
      name: defaultName('Border'),

      // Strict geometry constraints (Center aligned for symmetric growth)
      left: docWidth / 2,
      top: docHeight / 2,
      width: w,
      height: h,

      // Interaction constraints
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: true,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      perPixelTargetFind: true,
      subTargetCheck: false,

      // Origin determines layout positioning
      originX: 'center',
      originY: 'center',

      // Custom and styling properties
      roohAssetType: 'border',
      roohBorderPadding: padding,
      roohBorderThickness: thickness,
      strokeWidth: 0, // Force 0 to bypass all native Fabric bounds expansion!
      stroke: strokeColor,
      opacity: opacity,
      strokeDashArray: dashArray,
      fill: 'transparent'
    } as any);

    return border;
  }

  // BORDER PADDING:
  // Updates the inset padding of the border layer symmetrically from the document canvas boundaries.
  // Controlled by: PropertiesPanel Border Inset/Padding slider.
  static updateBorderPadding(borderLayer: FabricObject, padding: number, docWidth: number, docHeight: number): void {
    const w = docWidth - padding * 2;
    const h = docHeight - padding * 2;

    // Mutate ONLY position and scale logic, maintain center alignment
    borderLayer.set({
      left: docWidth / 2,
      top: docHeight / 2,
      width: w,
      height: h,
      roohBorderPadding: padding,
      dirty: true
    } as any);

    borderLayer.setCoords();
  }

  // BORDER THICKNESS:
  // Updates the existing border thickness property without modifying native strokeWidth.
  // Controlled by: PropertiesPanel Border Thickness slider.
  static updateBorderThickness(borderLayer: FabricObject, thickness: number): void {
    // Mutate ONLY our custom thickness variable! Native strokeWidth remains 0.
    borderLayer.set({ roohBorderThickness: thickness, dirty: true } as any);

    // Because strokeWidth is 0, the geometry and bounds will remain perfectly identical.
    borderLayer.setCoords();
  }

  // BORDER COLOR:
  // Updates stroke color of the procedural border element.
  // Controlled by: PropertiesPanel Color picker.
  static updateBorderColor(borderLayer: FabricObject, color: string): void {
    borderLayer.set({ stroke: color });
    borderLayer.setCoords();
  }

  // BORDER STYLE (SOLID / DASHED / DOTTED):
  // Updates stroke style dash array configuration for procedural dashed or dotted border rendering.
  // Controlled by: PropertiesPanel Style toggle (solid, dashed, dotted).
  static updateBorderStyle(borderLayer: FabricObject, style: 'solid' | 'dashed' | 'dotted', dashArray: number[] | null): void {
    borderLayer.set({ strokeDashArray: dashArray, dirty: true } as any);
    borderLayer.setCoords();
  }
}
