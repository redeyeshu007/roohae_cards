'use client';

import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import type { PageEntry, RoohaeEditor } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { Button } from '../components/basics';
import { Tip } from '../components/overlays';

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

  return (
    <footer className="flex h-12 shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => void editor?.setActivePage(page.index)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              page.active
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
          >
            {page.name}
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
                    onClick={() => void editor?.duplicatePage(active.index)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Tip>
                <Tip label="Move page left">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={active.index === 0}
                    onClick={() => void editor?.reorderPage(active.index, active.index - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Tip>
                <Tip label="Move page right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={active.index === pages.length - 1}
                    onClick={() => void editor?.reorderPage(active.index, active.index + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Tip>
                <Tip label="Delete page">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pages.length <= 1}
                    onClick={() => void editor?.deletePage(active.index)}
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
