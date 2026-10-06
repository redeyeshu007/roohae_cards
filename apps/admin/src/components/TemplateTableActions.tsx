/**
 * FILE PURPOSE:
 * Action menu dropdown component for template rows in the admin templates table.
 *
 * MAIN RESPONSIBILITY:
 * Provides quick actions to edit design in editor, toggle publish/draft status,
 * duplicate template, preview thumbnail, and delete template with confirmation.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin/src/lib/queries.ts (useSetTemplateStatus, useDuplicateTemplate, useDeleteTemplate)
 * - apps/admin/src/app/editor/[templateId]/page.tsx (navigates to editor route)
 * - apps/admin/src/app/(panel)/templates/page.tsx (parent table view)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Download, Eye, Globe2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Template } from '@roohae/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@roohae/ui';
import {
  useDeleteTemplate,
  useDuplicateTemplate,
  useSetTemplateStatus,
} from '@/lib/queries';

export function TemplateTableActions({ template }: { template: Template }) {
  const router = useRouter();
  const setStatusMutation = useSetTemplateStatus();
  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => router.push(`/editor/${template.id}`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Design
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              setStatusMutation.mutate({
                id: template.id,
                status: template.status === 'published' ? 'draft' : 'published',
              })
            }
          >
            <Globe2 className="mr-2 h-4 w-4" />
            {template.status === 'published' ? 'Unpublish' : 'Publish'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => duplicateMutation.mutate(template.id)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Preview
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast.info('Download PNG coming soon')}>
            <Download className="mr-2 h-4 w-4" /> Download PNG
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast.info('Download PDF coming soon')}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {template.status !== 'archived' && (
            <DropdownMenuItem
              onSelect={() => setStatusMutation.mutate({ id: template.id, status: 'archived' })}
            >
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem destructive onSelect={() => deleteMutation.mutate(template.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          title="Preview"
          className="max-w-3xl bg-[#F8F4EF]"
          style={{
            backgroundImage: 'radial-gradient(#D6CFC4 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="flex min-h-[50vh] items-center justify-center">
            {template.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={template.thumbnailUrl}
                alt={template.title}
                className="max-h-[75vh] max-w-full rounded-sm bg-white object-contain shadow-2xl ring-1 ring-slate-900/5"
              />
            ) : (
              <p className="text-slate-400">No preview available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
