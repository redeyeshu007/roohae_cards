'use client';

/**
 * FILE PURPOSE:
 * Bottom page strip and canvas viewport zoom control bar.
 *
 * MAIN RESPONSIBILITY:
 * Provides multi-page card navigation (switching between Front and Back page sides),
 * page management actions for admins (Add, Duplicate, Delete page), and viewport zoom percentage controls.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/EditorWorkspace.tsx (renders PagesBar at the bottom)
 * - packages/editor-sdk/src/RoohaeEditor.ts (calls setActivePage, addPage, duplicatePage, deletePage, zoom methods)
 */

import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import type { PageEntry, RoohaeEditor } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { Button } from '../components/basics';
import { Tip } from '../components/overlays';

// PAGES BAR COMPONENT:
// Bottom navigation footer managing page selection, card front/back flips, and zoom controls.
export function PagesBar({
  editor,
  pages,
  zoom,
  allowPageManagement,
}: {
  editor: RoohaeEditor | null;
  pages: PageEntry[];
  zoom: number;
  /** Admins manage pages; users work within the template's page set. */
  allowPageManagement: boolean;
}) {
  const active = pages.find((p) => p.active);
  const activeCardIndex = active ? Math.floor(active.index / 2) : 0;
  const frontIndex = activeCardIndex * 2;

  const cards = [];
  for (let i = 0; i < pages.length; i += 2) {
    cards.push({
      index: i,
      name: `Page ${Math.floor(i / 2) + 1}`,
      active: Math.floor(i / 2) === activeCardIndex,
    });
  }

  return (
    <footer className="flex h-12 shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
        {cards.map((card) => (
          <button
            key={card.index}
            onClick={() => void editor?.setActivePage(card.index)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              card.active
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
          >
            {card.name}
          </button>
        ))}

        {allowPageManagement && (
          <>
            <Tip label="Add page">
              <Button variant="ghost" size="icon-sm" onClick={() => void editor?.addPage()}>
                <Plus className="h-4 w-4" />
              </Button>
            </Tip>
            {active && (
              <>
                <Tip label="Duplicate page">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void editor?.duplicatePage(frontIndex)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Tip>
                <Tip label="Move page left">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={frontIndex === 0}
                    onClick={() => void editor?.reorderPage(frontIndex, frontIndex - 2)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Tip>
                <Tip label="Move page right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={frontIndex >= pages.length - 2}
                    onClick={() => void editor?.reorderPage(frontIndex, frontIndex + 2)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Tip>
                <Tip label="Delete page">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pages.length <= 2}
                    onClick={() => void editor?.deletePage(frontIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </Tip>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => editor?.zoomOut()} aria-label="Zoom out">
          −
        </Button>
        <span className="w-12 text-center text-xs tabular-nums text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => editor?.zoomIn()} aria-label="Zoom in">
          +
        </Button>
      </div>
    </footer>
  );
}
