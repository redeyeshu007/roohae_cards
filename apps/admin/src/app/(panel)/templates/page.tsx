'use client';

import { memo, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, MoreHorizontal, Plus, Search } from 'lucide-react';
import type { Template, TemplateStatus } from '@roohae/shared';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import {
  useCategories,
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useSetTemplateStatus,
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
  const setStatusMutation = useSetTemplateStatus();
  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onOpen={() => router.push(`/editor/${template.id}`)}
              onPublish={() =>
                setStatusMutation.mutate({
                  id: template.id,
                  status: template.status === 'published' ? 'draft' : 'published',
                })
              }
              onArchive={() => setStatusMutation.mutate({ id: template.id, status: 'archived' })}
              onDuplicate={() => duplicateMutation.mutate(template.id)}
              onDelete={() => deleteMutation.mutate(template.id)}
            />
          ))}
        </div>
      )}

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

const TemplateCard = memo(function TemplateCard({
  template,
  onOpen,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
}: {
  template: Template;
  onOpen: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group overflow-hidden">
      <button onClick={onOpen} className="block w-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {template.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={template.thumbnailUrl}
              alt={template.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
              <LayoutTemplate className="h-10 w-10" />
            </div>
          )}
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{template.title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {template.category?.name ?? '—'} · {template.width}×{template.height}
            {template.unit}
          </p>
          <Badge variant={STATUS_BADGE[template.status]} className="mt-2 capitalize">
            {template.status}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpen}>Open in editor</DropdownMenuItem>
            <DropdownMenuItem onSelect={onPublish}>
              {template.status === 'published' ? 'Unpublish' : 'Publish'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
            {template.status !== 'archived' && (
              <DropdownMenuItem onSelect={onArchive}>Archive</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
});

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
