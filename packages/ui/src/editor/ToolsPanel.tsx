import { useState } from 'react';
import { ArrowLeft, Minus, PenTool, Square, Sticker, Type, QrCode } from 'lucide-react';
import { cn } from '../lib/cn';
import { Input } from '../components/basics';
import type { RoohaeEditor } from '@roohae/editor-sdk';

const CATEGORIES = [
  { id: 'simple', label: 'Simple Borders' },
  { id: 'lines', label: 'Lines & Arrows' },
];

const ASSETS = [
  { id: 'simple-1', category: 'simple', url: '/assets/borders/simple/border-1.svg', name: 'Simple 1', type: 'border' },
  { id: 'simple-2', category: 'simple', url: '/assets/borders/simple/border-2.svg', name: 'Simple 2', type: 'border' },
  { id: 'straight', category: 'lines', url: '/assets/borders/lines/straight.svg', name: 'Straight', type: 'line' },
  { id: 'dashed', category: 'lines', url: '/assets/borders/lines/dashed.svg', name: 'Dashed', type: 'line' },
  { id: 'dotted', category: 'lines', url: '/assets/borders/lines/dotted.svg', name: 'Dotted', type: 'line' },
  { id: 'arrow', category: 'lines', url: '/assets/borders/lines/arrow.svg', name: 'Arrow', type: 'line' },
  { id: 'curve', category: 'lines', url: '/assets/borders/lines/curve.svg', name: 'Curve', type: 'line' },
];

const TOOLS = [
  { id: 'borders-lines', label: 'Borders & Lines', icon: <Square className="w-5 h-5 text-indigo-500" /> },
  { id: 'draw', label: 'Draw', icon: <PenTool className="w-5 h-5 text-pink-500" />, disabled: true },
  { id: 'shapes', label: 'Shapes', icon: <Square className="w-5 h-5 text-blue-500" />, disabled: true },
  { id: 'pen', label: 'Pen', icon: <Minus className="w-5 h-5 text-purple-500" />, disabled: true },
  { id: 'sticky', label: 'Sticky Notes', icon: <Sticker className="w-5 h-5 text-yellow-500" />, disabled: true },
  { id: 'wordart', label: 'WordArt', icon: <Type className="w-5 h-5 text-red-500" />, disabled: true },
  { id: 'signature', label: 'Signature', icon: <PenTool className="w-5 h-5 text-green-500" />, disabled: true },
  { id: 'qrcode', label: 'QR Code', icon: <QrCode className="w-5 h-5 text-gray-500" />, disabled: true },
];

export function ToolsPanel({ editor }: { editor: RoohaeEditor | null }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (!activeTool) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#1F1F1F]">Tools</h3>
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => !tool.disabled && setActiveTool(tool.id)}
              disabled={tool.disabled}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl border border-[#E7DDD6] transition-all bg-white shadow-sm',
                tool.disabled 
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-[#C5A572] hover:shadow-md hover:scale-[1.02]'
              )}
            >
              <div className="mb-2 p-2 bg-[#F8F4EF] rounded-full">{tool.icon}</div>
              <span className="text-[11px] font-semibold text-[#1F1F1F] text-center">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'borders-lines') {
    const filteredAssets = ASSETS.filter(a => search === '' || a.category.includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()));
    
    return (
      <div className="flex flex-col h-full -mx-4 px-4 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => setActiveTool(null)}
            className="p-1.5 hover:bg-[#F8F4EF] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#6B6B6B]" />
          </button>
          <h3 className="text-lg font-bold text-[#1F1F1F]">Borders & Lines</h3>
        </div>
        
        <div className="mb-4">
          <Input 
            placeholder="Search borders..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 pb-20">
          {CATEGORIES.map(category => {
            const catAssets = filteredAssets.filter(a => a.category === category.id);
            if (catAssets.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8CA3B0]">{category.label}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {catAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => editor?.addSvgAsset(asset.url, asset.type as 'border' | 'line')}
                      className="group relative aspect-square bg-white border border-[#E7DDD6] rounded-2xl flex items-center justify-center p-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:border-[#C5A572]"
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

  return null;
}
