'use client';

import { ArrowLeft, Check, ChevronRight, CloudUpload, Keyboard, Loader2, Monitor, Redo2, Share2, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RoohaeEditor } from '@roohae/editor-sdk';
import { Button } from '../components/basics';
import { Tip } from '../components/overlays';

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

const SAVE_DOT: Record<SaveStatus, string> = {
  saved: 'bg-[#4F7A5A]',
  saving: 'bg-[#C5A572] animate-pulse',
  dirty: 'bg-[#C5A572]',
  error: 'bg-[#B35B5B]',
};

const SAVE_TEXT: Record<SaveStatus, string> = {
  saved: 'All changes saved',
  saving: 'Saving…',
  dirty: 'Unsaved changes',
  error: 'Save failed',
};

export function EditorTopBar({
  title,
  onTitleChange,
  onBack,
  editor,
  canUndo,
  canRedo,
  saveStatus,
  actions,
}: {
  title: string;
  onTitleChange?: (title: string) => void;
  onBack: () => void;
  editor: RoohaeEditor | null;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus?: SaveStatus;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-[64px] shrink-0 items-center border-b border-[#E7DDD6] bg-[#FFFDF9] px-4 shadow-sm">

      {/* ── Left: back + breadcrumb + undo/redo ── */}
      <div className="flex flex-1 items-center gap-3">
        <Tip label="Back to templates">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back"
            className="text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F8F4EF] rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Tip>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B6B6B]">
          <span className="hover:text-[#1F1F1F] cursor-pointer transition-colors" onClick={onBack}>Templates</span>
          <ChevronRight className="h-3 w-3 text-[#C5A572]/60" />
          <span className="text-[#1F1F1F] font-medium truncate max-w-[120px]">{title || 'Untitled'}</span>
        </div>

        <div className="h-5 w-px bg-[#E7DDD6]" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Tip label="Undo (Ctrl+Z)">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canUndo}
              onClick={() => void editor?.undo()}
              aria-label="Undo"
              className="text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F8F4EF] disabled:opacity-25 rounded-xl"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </Tip>
          <Tip label="Redo (Ctrl+Y)">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canRedo}
              onClick={() => void editor?.redo()}
              aria-label="Redo"
              className="text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F8F4EF] disabled:opacity-25 rounded-xl"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </Tip>
        </div>
      </div>

      {/* ── Center: editable title ── */}
      <div className="flex items-center justify-center">
        <input
          value={title}
          readOnly={!onTitleChange}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="w-56 truncate rounded-2xl border border-transparent bg-transparent px-4 py-2 text-center text-[14px] font-semibold text-[#1F1F1F] tracking-tight hover:border-[#E7DDD6] hover:bg-[#F8F4EF] focus:border-[#C5A572] focus:outline-none focus:ring-2 focus:ring-[#C5A572]/20 transition-all"
          aria-label="Design title"
          spellCheck={false}
        />
      </div>

      {/* ── Right: save status + preview + share + actions ── */}
      <div className="flex flex-1 items-center justify-end gap-2">

        {/* Save status pill */}
        {saveStatus && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#F8F4EF] border border-[#E7DDD6] px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full ${SAVE_DOT[saveStatus]} transition-colors`} />
            <span className="text-[11px] font-medium text-[#6B6B6B] whitespace-nowrap">
              {SAVE_TEXT[saveStatus]}
            </span>
            {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin text-[#C5A572]" />}
            {saveStatus === 'saved' && <Check className="h-3 w-3 text-[#4F7A5A]" />}
          </div>
        )}

        <div className="h-5 w-px bg-[#E7DDD6]" />

        {/* Preview */}
        <Tip label="Preview design">
          <Button variant="ghost" size="icon-sm" className="text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F8F4EF] rounded-xl">
            <Monitor className="h-4 w-4" />
          </Button>
        </Tip>

        {/* Keyboard shortcuts */}
        <Tip label="Keyboard shortcuts">
          <Button variant="ghost" size="icon-sm" className="text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F8F4EF] rounded-xl">
            <Keyboard className="h-4 w-4" />
          </Button>
        </Tip>

        {/* Share */}
        <Tip label="Share">
          <Button variant="ghost" size="icon-sm" className="text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#F8F4EF] rounded-xl">
            <Share2 className="h-4 w-4" />
          </Button>
        </Tip>

        <div className="h-5 w-px bg-[#E7DDD6]" />

        {/* Publish & custom actions */}
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
