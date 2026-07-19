'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import type { Category, MeasurementUnit, Orientation } from '@roohae/shared';
import { MEASUREMENT_UNITS } from '@roohae/shared';
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
} from '@roohae/ui';
import { PageHeader } from '@/components/AdminShell';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/lib/queries';

interface FormState {
  name: string;
  width: string;
  height: string;
  unit: MeasurementUnit;
  orientation: Orientation;
}

const EMPTY_FORM: FormState = { name: '', width: '', height: '', unit: 'px', orientation: 'portrait' };

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: categories, isLoading } = useCategories(search);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      width: String(category.width),
      height: String(category.height),
      unit: category.unit,
      orientation: category.orientation,
    });
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      width: Number(form.width),
      height: Number(form.height),
      unit: form.unit,
      orientation: form.orientation,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Design formats users can browse — each defines a default canvas size."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search categories…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : !categories?.length ? (
        <EmptyState
          title="No categories yet"
          description="Create your first category — e.g. Instagram Post, Business Card, Certificate."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> New category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.id} className="group relative p-5">
              <div className="mb-3 flex items-start justify-between">
                <div
                  className="flex items-center justify-center rounded-lg border-2 border-brand-200 bg-brand-50/60 text-[10px] font-semibold text-brand-500 dark:border-brand-800 dark:bg-brand-950/40"
                  style={{
                    width: 48,
                    height: Math.max(
                      20,
                      Math.min(48, (category.height / category.width) * 48),
                    ),
                  }}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(category)}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      destructive
                      onSelect={() => deleteMutation.mutate(category.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="font-semibold">{category.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {category.width} × {category.height} {category.unit} · {category.orientation}
              </p>
              <Badge variant="muted" className="mt-3">
                {category.templateCount ?? 0} template{category.templateCount === 1 ? '' : 's'}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit category' : 'New category'}
          description="Dimensions become the default canvas size for templates in this category."
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                required
                placeholder="e.g. Instagram Post"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cat-width">Width</Label>
                <Input
                  id="cat-width"
                  type="number"
                  required
                  min={1}
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-height">Height</Label>
                <Input
                  id="cat-height"
                  type="number"
                  required
                  min={1}
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Measurement</Label>
                <Select
                  value={form.unit}
                  onValueChange={(unit) => setForm({ ...form, unit: unit as MeasurementUnit })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEASUREMENT_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit === 'in' ? 'inch' : unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orientation</Label>
                <Select
                  value={form.orientation}
                  onValueChange={(o) => setForm({ ...form, orientation: o as Orientation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
