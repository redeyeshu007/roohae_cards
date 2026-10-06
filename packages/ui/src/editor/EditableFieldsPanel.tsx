'use client';

/**
 * FILE PURPOSE:
 * Customer quick-edit panel for all editable text fields across the design.
 *
 * MAIN RESPONSIBILITY:
 * Filters and lists all text elements flagged as roohEditable: true by the template author,
 * providing direct inline text inputs and "Select" focus buttons for non-designers.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/LeftSidebar.tsx (renders EditableFieldsPanel in user mode)
 * - packages/editor-sdk/src/RoohaeEditor.ts (calls editor.selectObject and editor.updateObjectText)
 * - apps/user/src/components/ProjectEditor.tsx (enables customer text customization)
 */

import { Type } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EditableField, RoohaeEditor } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';
import { EmptyState, Input, Label } from '../components/basics';

// EDITABLE FIELDS PANEL:
// Simplifies card personalization by exposing form-like inputs for all customizable card text.
export function EditableFieldsPanel({
  editor,
  fields,
}: {
  editor: RoohaeEditor | null;
  fields: EditableField[];
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => fields.filter((field) => field.label.toLowerCase().includes(search.trim().toLowerCase())),
    [fields, search],
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search editable fields..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Type className="h-7 w-7" />}
          title="No editable fields"
          description="This design has no editable text or customization fields."
          className="p-6"
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((field) => (
            <li
              key={field.id}
              className={cn(
                'rounded-xl border p-3 transition-colors',
                field.selected
                  ? 'border-brand-400 bg-brand-50/70 ring-1 ring-brand-300 dark:border-brand-600 dark:bg-brand-950/40'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="truncate">{field.label}</Label>
                <button
                  type="button"
                  onClick={() => editor?.selectObject(field.id)}
                  className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
                >
                  Select
                </button>
              </div>
              {field.value !== undefined ? (
                field.multiline ? (
                  <textarea
                    value={field.value}
                    rows={4}
                    onChange={(e) => editor?.updateObject(field.id, { text: e.target.value })}
                    className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                ) : (
                  <Input
                    value={field.value}
                    onChange={(e) => editor?.updateObject(field.id, { text: e.target.value })}
                  />
                )
              ) : (
                <p className="text-xs text-slate-400">
                  Select this field on the canvas to customize it.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
