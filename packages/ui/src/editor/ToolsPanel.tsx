import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Square, PenTool, Sticker, Type, Pencil, Highlighter, Eraser, Paintbrush, Sparkles, X, ChevronDown, Upload } from 'lucide-react';
import { cn } from '../lib/cn';
import { Input } from '../components/basics';
import { Slider } from '../components/controls';
import { ColorField } from './ColorField';
import type { RoohaeEditor, DrawBrushType } from '@roohae/editor-sdk';

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', label: 'Dancing Script' },
  { name: 'Great Vibes', label: 'Great Vibes' },
  { name: 'Pacifico', label: 'Pacifico' },
  { name: 'Caveat', label: 'Caveat' },
  { name: 'Satisfy', label: 'Satisfy' },
  { name: 'Alex Brush', label: 'Alex Brush' },
  { name: 'Sacramento', label: 'Sacramento' },
];

/* ───────────── Icons & Configuration for draw tools ───────────── */

const BRUSHES: Array<{ id: DrawBrushType; label: string; icon: React.ReactNode; iconColor: string; desc: string }> = [
  { id: 'pencil',      label: 'Pencil',      icon: <Pencil size={18} />,      iconColor: 'text-[#6366F1]', desc: 'Thin line' },
  { id: 'pen',         label: 'Pen',         icon: <PenTool size={18} />,     iconColor: 'text-[#8B5CF6]', desc: 'Crisp ink' },
  { id: 'marker',      label: 'Marker',      icon: <Highlighter size={18} />, iconColor: 'text-[#EC4899]', desc: 'Felt-tip' },
  { id: 'highlighter', label: 'Highlighter', icon: <Highlighter size={18} />, iconColor: 'text-[#F59E0B]', desc: 'Overlay' },
  { id: 'brush',       label: 'Brush',       icon: <Paintbrush size={18} />,  iconColor: 'text-[#10B981]', desc: 'Textured' },
  { id: 'chalk',       label: 'Chalk',       icon: <Pencil size={18} />,      iconColor: 'text-[#F97316]', desc: 'Grainy' },
  { id: 'spray',       label: 'Spray',       icon: <Sparkles size={18} />,    iconColor: 'text-[#06B6D4]', desc: 'Particles' },
  { id: 'eraser',      label: 'Eraser',      icon: <Eraser size={18} />,      iconColor: 'text-[#EF4444]', desc: 'Remove' },
];

const PRESET_COLORS = [
  '#000000', '#475569', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#ffffff',
];

const CATEGORIES = [
  { id: 'simple', label: 'Simple Borders' },
  { id: 'lines', label: 'Lines & Arrows' },
];

const ASSETS = [
  { id: 'simple-1', category: 'simple', url: '/assets/borders/simple/border-1.svg', name: 'Simple 1', type: 'border' },
  { id: 'straight', category: 'lines', url: '/assets/borders/lines/straight.svg', name: 'Straight', type: 'line' },
  { id: 'dashed', category: 'lines', url: '/assets/borders/lines/dashed.svg', name: 'Dashed', type: 'line' },
  { id: 'dotted', category: 'lines', url: '/assets/borders/lines/dotted.svg', name: 'Dotted', type: 'line' },
  { id: 'arrow', category: 'lines', url: '/assets/borders/lines/arrow.svg', name: 'Arrow', type: 'line' },
  { id: 'curve', category: 'lines', url: '/assets/borders/lines/curve.svg', name: 'Curve', type: 'line' },
];

const TOOLS = [
  { id: 'borders-lines', label: 'Borders &\nLines', icon: <Square className="w-5 h-5 text-[#6366F1]" /> },
  { id: 'draw', label: 'Draw', icon: <PenTool className="w-5 h-5 text-[#EC4899]" /> },
  { id: 'sticky', label: 'Sticky Notes', icon: <Sticker className="w-5 h-5 text-[#F59E0B]" /> },
  { id: 'wordart', label: 'WordArt', icon: <Type className="w-5 h-5 text-[#EF4444]" /> },
  { id: 'signature', label: 'Signature', icon: <PenTool className="w-5 h-5 text-[#10B981]" /> },
];

function SignatureDrawPad({
  color,
  thickness,
  onColorChange,
  onThicknessChange,
  onAddSignature,
}: {
  color: string;
  thickness: number;
  onColorChange: (c: string) => void;
  onThicknessChange: (t: number) => void;
  onAddSignature: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    setHasDrawn(true);

    const coords = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const handleAdd = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onAddSignature(dataUrl);
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 overflow-y-auto [scrollbar-width:none]">
      {/* Canvas Drawing Box */}
      <div className="relative w-full h-44 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF9] shadow-inner overflow-hidden flex flex-col justify-between p-2 shrink-0">
        <div className="flex items-center justify-between px-2 pt-1 z-10">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sign below</span>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs font-bold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
          >
            Clear
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-sm font-medium">
            Draw your signature here...
          </div>
        )}
      </div>

      {/* Ink Colour Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#1F1F1F]">Ink Colour</label>
        <div className="flex items-center gap-2">
          <ColorField value={color} onChange={onColorChange} />
          <div className="flex items-center gap-1.5">
            {['#000000', '#1E3A8A', '#047857', '#B91C1C', '#6D28D9'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                className={cn(
                  'w-7 h-7 rounded-full border border-slate-200 transition-transform hover:scale-110',
                  color.toLowerCase() === c.toLowerCase() && 'ring-2 ring-[#8B5CF6] ring-offset-1 scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thickness */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Thickness</span>
          <span>{thickness}px</span>
        </div>
        <Slider
          value={[thickness]}
          min={1}
          max={20}
          step={1}
          onValueChange={([val]) => onThicknessChange(val!)}
        />
      </div>

      {/* Add Signature Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!hasDrawn}
          className={cn(
            'w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]',
            hasDrawn
              ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] cursor-pointer'
              : 'bg-slate-300 cursor-not-allowed opacity-60'
          )}
        >
          Add signature
        </button>
      </div>
    </div>
  );
}

export function ToolsPanel({ editor }: { editor: RoohaeEditor | null }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeBrush, setActiveBrush] = useState<string | null>(null);

  // Customization state for Draw Tools
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [thickness, setThickness] = useState(8);
  const [opacity, setOpacity] = useState(1);

  // State for Signature Panel
  const [sigTab, setSigTab] = useState<'text' | 'draw' | 'upload'>('text');
  const [sigName, setSigName] = useState('Signature');
  const [sigFont, setSigFont] = useState('Dancing Script');
  const [sigColor, setSigColor] = useState('#000000');
  const [sigSave, setSigSave] = useState(true);

  // Load Google fonts for signatures dynamically
  useEffect(() => {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Sacramento&family=Satisfy&display=swap';
    if (!document.querySelector(`link[href="${fontUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      document.head.appendChild(link);
    }
  }, []);

  const handleBrushClick = useCallback((brushId: DrawBrushType) => {
    const toolId = `draw-${brushId}`;
    editor?.toolManager.activate(toolId, {
      color: selectedColor,
      thickness,
      opacity,
    });
    setActiveBrush(brushId);
  }, [editor, selectedColor, thickness, opacity]);

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    editor?.toolManager.updateActiveToolConfig({ color: newColor });
  };

  const handleThicknessChange = (newThickness: number) => {
    setThickness(newThickness);
    editor?.toolManager.updateActiveToolConfig({ thickness: newThickness });
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    editor?.toolManager.updateActiveToolConfig({ opacity: newOpacity });
  };

  if (!activeTool) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#1F1F1F]">Tools</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === 'draw') { 
                  setActiveTool('draw');
                  if (!activeBrush) {
                    editor?.toolManager.activate('draw-pencil', {
                      color: selectedColor,
                      thickness,
                      opacity,
                    });
                    setActiveBrush('pencil');
                  }
                }
                else if (tool.id === 'signature') { setActiveTool('signature'); }
                else if (tool.id === 'sticky') { editor?.addStickyNote(); }
                else if (tool.id === 'wordart') { editor?.addWordArt(); }
                else { setActiveTool(tool.id); }
              }}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#F3ECE4] bg-[#FFFDF9] transition-all duration-200 hover:border-[#1F1F1F]/30 hover:bg-white hover:shadow-md hover:scale-[1.02] aspect-[1/0.95] draw-tool-button"
            >
              <div className="w-11 h-11 rounded-full bg-[#F8F3EC] flex items-center justify-center mb-2.5 shrink-0 shadow-xs">
                {tool.icon}
              </div>
              <span className="text-[12px] font-bold text-[#1F1F1F] text-center leading-tight whitespace-pre-line">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'signature') {
    return (
      <div className="flex flex-col h-full -mx-4 px-4 pb-4 select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTool(null);
                editor?.toolManager.activate(null);
              }}
              className="p-1.5 hover:bg-[#F8F4EF] rounded-xl transition-colors text-[#1F1F1F]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#1F1F1F]">Create signature</h3>
          </div>
          <button
            onClick={() => {
              setActiveTool(null);
              editor?.toolManager.activate(null);
            }}
            className="p-1.5 hover:bg-[#F8F4EF] rounded-xl transition-colors text-[#6B6B6B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB] mb-5">
          {[
            { id: 'text', label: 'Text' },
            { id: 'draw', label: 'Draw' },
            { id: 'upload', label: 'Upload' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                const newTab = tab.id as 'text' | 'draw' | 'upload';
                setSigTab(newTab);
                editor?.toolManager.activate(null);
              }}
              className={cn(
                'flex-1 pb-2.5 text-center text-sm font-semibold transition-all relative',
                sigTab === tab.id
                  ? 'text-[#1F1F1F] font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {tab.label}
              {sigTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5CF6] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {sigTab === 'text' && (
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto [scrollbar-width:none]">
            {/* Preview Box */}
            <div className="w-full h-36 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF9] flex items-center justify-center p-4 shadow-inner">
              <span
                style={{ fontFamily: sigFont, color: sigColor }}
                className="text-4xl text-center break-all transition-all"
              >
                {sigName || 'Signature'}
              </span>
            </div>

            {/* Full name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F1F1F]">Full name</label>
              <Input
                value={sigName}
                onChange={e => setSigName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-xl border border-[#E7DDD6] bg-[#FFFDF9] px-3.5 py-2.5 text-sm font-medium text-[#1F1F1F] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            {/* Font selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F1F1F]">Font</label>
              <div className="relative">
                <select
                  value={sigFont}
                  onChange={e => setSigFont(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#E7DDD6] bg-[#FFFDF9] px-3.5 py-2.5 text-sm font-medium text-[#1F1F1F] focus:border-[#8B5CF6] focus:outline-none cursor-pointer pr-10"
                >
                  {SIGNATURE_FONTS.map(f => (
                    <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Colour selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1F1F1F]">Colour</label>
              <div className="flex items-center gap-2">
                <ColorField
                  value={sigColor}
                  onChange={c => setSigColor(c)}
                />
                <div className="flex items-center gap-1.5">
                  {['#000000', '#1E3A8A', '#047857', '#B91C1C', '#6D28D9'].map(c => (
                    <button
                      key={c}
                      onClick={() => setSigColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full border border-slate-200 transition-transform hover:scale-110',
                        sigColor.toLowerCase() === c.toLowerCase() && 'ring-2 ring-[#8B5CF6] ring-offset-1 scale-110'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Save signature toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-[#1F1F1F]">Save signature</span>
              <button
                type="button"
                onClick={() => setSigSave(!sigSave)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative p-0.5',
                  sigSave ? 'bg-[#8B5CF6]' : 'bg-slate-200'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                    sigSave ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Add signature button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  editor?.addTextSignature(sigName, sigFont, sigColor);
                }}
                className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                Add signature
              </button>
            </div>
          </div>
        )}

        {sigTab === 'draw' && (
          <SignatureDrawPad
            color={selectedColor}
            thickness={thickness}
            onColorChange={setSelectedColor}
            onThicknessChange={setThickness}
            onAddSignature={(dataUrl) => {
              editor?.addImage(dataUrl);
            }}
          />
        )}

        {sigTab === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E5E7EB] rounded-2xl bg-[#FFFDF9] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F1F1F]">Upload signature image</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG or SVG with transparent background</p>
            </div>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (evt.target?.result) {
                        editor?.addImage(evt.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold shadow-sm hover:bg-[#7C3AED] transition-colors"
            >
              Browse file
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'borders-lines') {
    const filteredAssets = ASSETS.filter(a => search === '' || a.category.includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()));
    
    return (
      <div className="flex flex-col h-full -mx-4 px-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <button 
            onClick={() => setActiveTool(null)}
            className="p-1.5 hover:bg-[#F8F4EF] rounded-xl transition-colors text-[#6B6B6B] hover:text-[#1F1F1F]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-base font-bold text-[#1F1F1F]">Borders & Lines</h3>
        </div>
        
        <div className="mb-3">
          <Input 
            placeholder="Search borders..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-5 pb-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(category => {
            const catAssets = filteredAssets.filter(a => a.category === category.id);
            if (catAssets.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{category.label}</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {catAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => editor?.addSvgAsset(asset.url, asset.type as 'border' | 'line')}
                      className="group relative aspect-square bg-[#FFFDF9] border border-[#F3ECE4] rounded-2xl flex items-center justify-center p-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:border-[#1F1F1F]"
                    >
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-contain pointer-events-none transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                      <span className="absolute bottom-2 left-2 right-2 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {asset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTool === 'draw') {
    return (
      <div className="flex flex-col h-full -mx-4 px-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <button 
            onClick={() => {
              setActiveTool(null);
              setActiveBrush(null);
              editor?.toolManager.activate(null);
            }}
            className="p-1.5 hover:bg-[#F8F4EF] rounded-xl transition-colors text-[#6B6B6B] hover:text-[#1F1F1F]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-[14px] font-bold text-[#1F1F1F] leading-tight">Draw Tools</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Select a tool and draw on canvas</p>
          </div>
        </div>
        
        {/* Brushes Grid - Slightly reduced compact cards */}
        <div className="grid grid-cols-2 gap-2 mb-2.5 shrink-0">
          {BRUSHES.map(brush => {
            const isActive = activeBrush === brush.id;
            return (
              <button
                key={brush.id}
                onClick={() => handleBrushClick(brush.id)}
                className={cn(
                  'flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 aspect-[1/0.92]',
                  isActive
                    ? 'border-2 border-[#1F1F1F] bg-white shadow-md scale-[1.02] ring-1 ring-black/5'
                    : 'border-[#F3ECE4] bg-[#FFFDF9] hover:border-[#1F1F1F]/30 hover:bg-white hover:scale-[1.01]'
                )}
              >
                {/* Circular Icon Badge */}
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center mb-1.5 shrink-0 transition-colors shadow-xs',
                  isActive ? 'bg-[#1F1F1F] text-white' : 'bg-[#F8F3EC] ' + brush.iconColor
                )}>
                  {brush.icon}
                </div>
                
                {/* Label */}
                <span className={cn(
                  'text-[11px] font-bold text-center leading-tight',
                  isActive ? 'text-[#1F1F1F]' : 'text-[#333333]'
                )}>
                  {brush.label}
                </span>
                
                {/* Subtext */}
                <span className="text-[9px] text-slate-400 text-center leading-tight mt-0.5 truncate w-full">
                  {brush.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Draw Settings Card */}
        {activeBrush && activeBrush !== 'eraser' && (
          <div className="mt-1 space-y-2.5 rounded-2xl border border-[#F3ECE4] bg-[#FFFDF9] p-3 shadow-sm shrink-0">
            {/* Color Selector */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Stroke Color
              </p>
              
              <ColorField
                value={selectedColor}
                onChange={handleColorChange}
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      'h-5 w-5 rounded-md border border-slate-200 shadow-xs transition-transform hover:scale-110 focus:outline-none dark:border-slate-700',
                      selectedColor.toLowerCase() === color.toLowerCase() && 'ring-2 ring-brand-500 ring-offset-1 scale-110 border-[#1F1F1F]'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Size / Thickness Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-500">Size</span>
                <span className="font-mono text-slate-700">{thickness} px</span>
              </div>
              <Slider
                value={[thickness]}
                min={1}
                max={50}
                step={1}
                onValueChange={([val]) => handleThicknessChange(val!)}
              />
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-500">Opacity</span>
                <span className="font-mono text-slate-700">{Math.round(opacity * 100)}%</span>
              </div>
              <Slider
                value={[opacity * 100]}
                min={10}
                max={100}
                step={5}
                onValueChange={([val]) => handleOpacityChange(val! / 100)}
              />
            </div>
          </div>
        )}

        {/* Eraser Size Card */}
        {activeBrush === 'eraser' && (
          <div className="mt-1 space-y-1.5 rounded-2xl border border-[#F3ECE4] bg-[#FFFDF9] p-3 shadow-sm shrink-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-500">Eraser Size</span>
              <span className="font-mono text-slate-700">{thickness} px</span>
            </div>
            <Slider
              value={[thickness]}
              min={5}
              max={80}
              step={1}
              onValueChange={([val]) => handleThicknessChange(val!)}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
