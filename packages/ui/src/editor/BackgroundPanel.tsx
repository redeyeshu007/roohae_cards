import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { RoohaeEditor } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { Button } from '../components/basics';
import { ColorField } from './ColorField';
import { Tabs, TabsList, TabsTrigger, TabsContent, Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/controls';

export interface BackgroundPanelProps {
  editor: RoohaeEditor;
  onUpload?: (file: File) => Promise<{ id: string; url: string }>;
  uploading?: boolean;
}

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3',
  '#ede9fe', '#0f172a', '#1e293b', '#7c3aed', '#0ea5e9', '#f43f5e'
];

export function BackgroundPanel({ editor, onUpload, uploading }: BackgroundPanelProps) {
  const [mode, setMode] = useState<'color' | 'image'>('color');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeIndex = editor.getPages().findIndex(p => p.active);
  const page = editor.getDocument().pages[activeIndex === -1 ? 0 : activeIndex]!;
  const hasImage = !!page.backgroundAssetId;
  const settings = page.backgroundImageSettings ?? { fit: 'fill', opacity: 100, blur: 0 };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    try {
      const asset = await onUpload(file);
      await editor.setPageBackgroundAsset(asset.id, asset.url);
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 px-1">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'color' | 'image')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="color">Color</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {mode === 'color' && (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Page color
            </p>
            <ColorField
              value={editor.getPageBackground()}
              onChange={(hex) => editor.setPageBackground(hex)}
            />
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => editor.setPageBackground(hex)}
                  className="aspect-square rounded-lg border border-slate-200 shadow-sm dark:border-slate-700 hover:ring-2 hover:ring-[#C5A572] transition-all"
                  style={{ backgroundColor: hex }}
                  aria-label={`Background ${hex}`}
                />
              ))}
            </div>
          </div>
        )}

        {mode === 'image' && (
          <div className="space-y-6 pb-6">
            {!hasImage ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E7DDD6] bg-[#FBF8F1] p-6 text-center">
                <ImageIcon className="mb-3 h-8 w-8 text-[#C5A572]" />
                <p className="mb-1 text-sm font-medium text-[#1F1F1F]">Upload Background</p>
                <p className="mb-4 text-xs text-[#8CA3B0]">or Drag & Drop Image</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  disabled={!onUpload}
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload Background
                </Button>
                <p className="mt-4 text-[10px] text-[#8CA3B0]">Supported: PNG • JPG • JPEG • WEBP</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#1F1F1F]">Image Settings</label>
                  <Select
                    value={settings.fit}
                    onValueChange={(val: any) => editor.setPageBackgroundImageSettings({ fit: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fit mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit</SelectItem>
                      <SelectItem value="fill">Fill</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="tile">Tile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1F1F1F]">Opacity</label>
                    <span className="text-xs text-[#6B6B6B]">{settings.opacity}%</span>
                  </div>
                  <Slider
                    value={[settings.opacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(vals) => editor.setPageBackgroundImageSettings({ opacity: vals[0] })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1F1F1F]">Blur</label>
                    <span className="text-xs text-[#6B6B6B]">{settings.blur}px</span>
                  </div>
                  <Slider
                    value={[settings.blur]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={(vals) => editor.setPageBackgroundImageSettings({ blur: vals[0] })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1F1F1F]">Rotation</label>
                    <span className="text-xs text-[#6B6B6B]">{settings.rotation ?? 0}°</span>
                  </div>
                  <Slider
                    value={[settings.rotation ?? 0]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={(vals) => editor.setPageBackgroundImageSettings({ rotation: vals[0] })}
                  />
                </div>

                <div className="pt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      loading={uploading}
                      disabled={!onUpload}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" /> Replace
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => editor.removePageBackgroundImage()}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
