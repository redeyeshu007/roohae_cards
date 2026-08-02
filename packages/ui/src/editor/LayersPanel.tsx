'use client';

import { Eye, EyeOff, Image as ImageIcon, Lock, LockOpen, Shapes, Type } from 'lucide-react';
import { useState } from 'react';
import type { LayerEntry, RoohaeEditor } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { EmptyState } from '../components/basics';

function layerIcon(type: string) {
  if (type === 'textbox' || type === 'i-text') return <Type className="h-3.5 w-3.5" />;
  if (type === 'image') return <ImageIcon className="h-3.5 w-3.5" />;
  return <Shapes className="h-3.5 w-3.5" />;
}

export function LayersPanel({
  editor,
  layers,
}: {
  editor: RoohaeEditor | null;
  layers: LayerEntry[];
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  if (!layers.length) {
    return <EmptyState title="No layers yet" description="Objects you add appear here, top-most first." className="p-6" />;
  }

  return (
    <ul className="space-y-1">
      {layers.map((layer, index) => (
        <li
          key={layer.id || `layer-${index}`}
          className={cn(
            'group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm transition-colors',
            layer.selected
              ? 'border-brand-300 bg-brand-50/70 dark:border-brand-700 dark:bg-brand-950/40'
              : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800',
          )}
        >
          <button
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={() => editor?.selectObject(layer.id)}
            onDoubleClick={() => {
              setRenamingId(layer.id);
              setDraft(layer.name);
            }}
          >
            <span className="text-slate-400">{layerIcon(layer.type)}</span>
            {renamingId === layer.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  if (draft.trim()) editor?.renameObject(layer.id, draft.trim());
                  setRenamingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="w-full rounded border border-brand-300 bg-white px-1 py-0.5 text-xs focus:outline-none dark:bg-slate-900"
              />
            ) : (
              <span
                className={cn(
                  'truncate text-slate-700 dark:text-slate-200',
                  layer.hidden && 'opacity-40',
                )}
              >
                {layer.name}
              </span>
            )}
          </button>

          <button
            onClick={() => editor?.toggleHidden(layer.id)}
            className="text-slate-400 opacity-0 transition-opacity hover:text-slate-700 group-hover:opacity-100 dark:hover:text-slate-200"
            aria-label={layer.hidden ? 'Show layer' : 'Hide layer'}
          >
            {layer.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => editor?.toggleLock(layer.id)}
            className={cn(
              'text-slate-400 transition-opacity hover:text-slate-700 dark:hover:text-slate-200',
              layer.locked ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-100',
            )}
            aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
          >
            {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
