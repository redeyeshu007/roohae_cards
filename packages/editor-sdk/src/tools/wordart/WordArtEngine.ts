import { Textbox, FabricText, FabricObject, Path } from 'fabric';

export interface WordArtOptions {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  style?: 'arc' | 'wave' | 'circle' | 'outline' | 'shadow' | '3d';
}

export class WordArtEngine {
  static createWordArt(options: WordArtOptions = {}): FabricObject {
    const text = options.text || 'Word Art';
    const style = options.style || 'outline';
    
    // Base configuration with standard project selection styling
    const baseConfig = {
      text,
      fontFamily: options.fontFamily || 'Inter',
      fontSize: options.fontSize || 80,
      fontWeight: 800,
      roohAssetType: 'wordart',
      roohWordArtStyle: style,
      textAlign: 'center',
      
      // Custom selection styling to match the project's aesthetics
      transparentCorners: false,
      cornerColor: '#FFFFFF',
      cornerStrokeColor: '#94A3B8',
      borderColor: '#8B5CF6',
      cornerSize: 12,
      cornerStyle: 'circle',
      borderScaleFactor: 2.5,
    } as any;

    let specificConfig = {};

    switch (style) {
      case 'outline':
        specificConfig = {
          fill: '#FFFFFF',
          stroke: '#000000',
          strokeWidth: 4,
        };
        break;
      case 'shadow':
        specificConfig = {
          fill: '#FFFFFF',
          shadow: {
            color: 'rgba(0,0,0,0.4)',
            blur: 10,
            offsetX: 8,
            offsetY: 8
          },
        };
        break;
      case '3d':
        specificConfig = {
          fill: '#FCD34D', // Amber-300
          stroke: '#D97706',
          strokeWidth: 2,
          shadow: {
            color: '#B45309',
            blur: 0,
            offsetX: 4,
            offsetY: 4
          },
        };
        break;
      case 'circle': // using 'neon' glow for circle style for now as placeholder
        specificConfig = {
          fill: '#FFFFFF',
          stroke: '#06B6D4',
          strokeWidth: 2,
          shadow: {
            color: '#06B6D4', // Cyan neon glow
            blur: 20,
            offsetX: 0,
            offsetY: 0
          },
        };
        break;
      case 'wave': // using 'retro' style for wave for now
        specificConfig = {
          fill: '#F43F5E', // Rose-500
          stroke: '#1E1B4B',
          strokeWidth: 4,
          shadow: {
            color: '#FDE047', // Yellow-300 shadow
            blur: 0,
            offsetX: -6,
            offsetY: 6
          },
        };
        break;
      case 'arc': // using 'gold' style for arc for now
        specificConfig = {
          fill: '#FBBF24', // Amber-400
          stroke: '#451A03',
          strokeWidth: 3,
        };
        break;
      default:
        specificConfig = { fill: '#000000' };
    }

    const textbox = new Textbox(text, {
      ...baseConfig,
      ...specificConfig,
    });
    
    return textbox;
  }
}
