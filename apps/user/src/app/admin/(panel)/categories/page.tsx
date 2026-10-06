/**
 * FILE PURPOSE:
 * Design format categories management interface for admin inside user app.
 *
 * MAIN RESPONSIBILITY:
 * Displays all card categories with dimension preview and template counters,
 * enables creating, editing, and deleting categories with default canvas units.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/admin-queries.ts (useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory)
 * - apps/api/src/modules/categories/categories.routes.ts
 */

'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus, Search, FolderTree } from 'lucide-react';
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
} from '@/lib/admin-queries';

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

  // API QUERIES & MUTATIONS:
  // Fetches categories and provides mutation handlers
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

  // SUBMIT FLOW:
  // Form submission -> createMutation or updateMutation -> POST or PATCH /api/v1/categories
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
        breadcrumb="Admin / Categories"
        actions={
          // BUTTON:
          // Open create category dialog
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
          <Input
            placeholder="Search categories…"
            className="pl-11 h-11 rounded-full bg-[#FFFDF9] border-none shadow-sm"
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
          icon={<FolderTree className="h-10 w-10" />}
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
            <Card key={category.id} className="group relative p-5 bg-[#FFFDF9] shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F4EF]/60 border border-[#E7DDD6]/50 transition-colors group-hover:bg-[#F8F4EF]">
                  <div
                    className="rounded-[4px] border border-[#C5A572]/30 bg-gradient-to-br from-[#FFFDF9] to-[#F8F4EF] shadow-sm transition-all duration-300 group-hover:shadow group-hover:border-[#C5A572]/60 group-hover:scale-105"
                    style={{
                      width: category.width > category.height ? 40 : 40 * (category.width / category.height),
                      height: category.height >= category.width ? 40 : 40 * (category.height / category.width),
                    }}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {/* BUTTON:
                        Category options menu */}
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* BUTTON:
                        Edit category */}
                    <DropdownMenuItem onSelect={() => openEdit(category)}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {/* BUTTON:
                        Delete category */}
                    <DropdownMenuItem
                      destructive
                      onSelect={() => deleteMutation.mutate(category.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-[15px] font-primary font-medium text-[#1F1F1F]">{category.name}</p>
              <p className="mt-1 text-[13px] text-[#6B6B6B] font-secondary">
                {category.width} × {category.height} {category.unit} · {category.orientation}
              </p>
              <Badge variant="muted" className="mt-3">
                {category.templateCount ?? 0} template{category.templateCount === 1 ? '' : 's'}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT CATEGORY DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit category' : 'New category'}
          description="Dimensions become the default canvas size for templates in this category."
          className="max-w-3xl"
        >
          <form onSubmit={onSubmit} className="space-y-6 pt-2">
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
            <div className="grid grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-6">
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
