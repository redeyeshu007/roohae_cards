'use client';

import { memo, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, Plus, Search } from 'lucide-react';
import type { Template, TemplateStatus } from '@roohae/shared';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import { TemplateTableActions } from '@/components/TemplateTableActions';
import {
  useCategories,
  useCreateTemplate,
  useTemplates,
} from '@/lib/queries';

const STATUS_BADGE: Record<TemplateStatus, 'success' | 'warning' | 'muted'> = {
  published: 'success',
  draft: 'warning',
  archived: 'muted',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useTemplates({
    status: status === 'all' ? undefined : status,
    search,
  });

  return (
    <>
      <PageHeader
        title="Templates"
        description="Design templates users can customize. Only published templates are visible to users."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create template
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search templates…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3]" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={<LayoutTemplate className="h-8 w-8" />}
          title="No templates found"
          description="Create a template from a category to get started."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create template
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="w-12 px-6 py-3 font-medium">
                    <input type="checkbox" className="rounded border-slate-300" disabled />
                  </th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Uses</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="w-12 px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <input type="checkbox" className="rounded border-slate-300" disabled />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-12 overflow-hidden rounded bg-slate-100 dark:bg-slate-800 shrink-0">
                          {template.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={template.thumbnailUrl}
                              alt={template.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-300">
                              <LayoutTemplate className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {template.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {template.width}×{template.height} {template.unit}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {template.category?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {template.usageCount ?? 0}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={STATUS_BADGE[template.status]} className="capitalize">
                        {template.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <TemplateTableActions template={template} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

/**
 * Canva-style "create design" flow: pick a category → dimensions auto-fill →
 * admin may still adjust before the editor opens.
 */
function CreateTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createMutation = useCreateTemplate();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  const selected = useMemo(
    () => categories?.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  function onCategoryChange(id: string) {
    setCategoryId(id);
    const category = categories?.find((c) => c.id === id);
    if (category) {
      // Auto-fill from the category — still editable before creation.
      setWidth(String(category.width));
      setHeight(String(category.height));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const template = await createMutation.mutateAsync({
      title: title.trim(),
      categoryId,
      width: Number(width),
      height: Number(height),
      unit: selected.unit,
      orientation: selected.orientation,
      tags: [],
    });
    onOpenChange(false);
    router.push(`/editor/${template.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Create template"
        description="Selecting a category fills in its dimensions — adjust them if this template needs a custom size."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-title">Title</Label>
            <Input
              id="tpl-title"
              required
              placeholder="e.g. Elegant Wedding Invitation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.width}×{category.height}
                    {category.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tpl-width">Width {selected ? `(${selected.unit})` : ''}</Label>
              <Input
                id="tpl-width"
                type="number"
                required
                min={1}
                disabled={!selected}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-height">Height {selected ? `(${selected.unit})` : ''}</Label>
              <Input
                id="tpl-height"
                type="number"
                required
                min={1}
                disabled={!selected}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selected} loading={createMutation.isPending}>
              Create & open editor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
