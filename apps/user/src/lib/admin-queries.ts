'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ActivityLog,
  Asset,
  Category,
  CreateCategoryInput,
  CreateTemplateInput,
  DashboardStats,
  DesignDocument,
  Font,
  PaginationMeta,
  Template,
  TemplateStatus,
  UpdateCategoryInput,
  User,
} from '@roohae/shared';
import { apiErrorMessage } from '@roohae/ui';
import { api } from './api';

interface Envelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

function onError(error: unknown): void {
  toast.error(apiErrorMessage(error));
}

/* -------------------------------------------------------------- dashboard */

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    staleTime: 60_000, // stats are fine to be 1 min stale
    queryFn: async () => (await api.get<Envelope<DashboardStats>>('/dashboard/stats')).data.data,
  });
}

/* -------------------------------------------------------------- categories */

export function useCategories(search = '') {
  return useQuery({
    queryKey: ['categories', search],
    staleTime: 5 * 60_000, // categories change rarely
    queryFn: async () =>
      (
        await api.get<Envelope<Category[]>>('/categories', {
          params: { limit: 100, search: search || undefined },
        })
      ).data.data,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) =>
      (await api.post<Envelope<Category>>('/categories', input)).data.data,
    onSuccess: () => {
      toast.success('Category created');
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError,
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCategoryInput & { id: string }) =>
      (await api.patch<Envelope<Category>>(`/categories/${id}`, input)).data.data,
    onSuccess: () => {
      toast.success('Category updated');
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError,
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/categories/${id}`)).data,
    onSuccess: () => {
      toast.success('Category deleted');
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError,
  });
}

/* --------------------------------------------------------------- templates */

export function useTemplates(filters: { status?: string; categoryId?: string; search?: string }) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const res = await api.get<Envelope<Template[]>>('/templates', {
        params: { limit: 50, ...filters, search: filters.search || undefined },
      });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['templates', 'detail', id],
    enabled: Boolean(id),
    staleTime: 2 * 60_000, // template data stale after 2 min
    queryFn: async () => (await api.get<Envelope<Template>>(`/templates/${id}`)).data.data,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) =>
      (await api.post<Envelope<Template>>('/templates', input)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['templates'] }),
    onError,
  });
}


export function useSaveTemplate(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title?: string;
      document?: DesignDocument;
      thumbnail?: string;
    }) => (await api.patch<Envelope<Template>>(`/templates/${id}`, input)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['templates'], exact: false }),
  });
}

export function useSetTemplateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TemplateStatus }) =>
      (await api.patch<Envelope<Template>>(`/templates/${id}/status`, { status })).data.data,
    onSuccess: (t) => {
      toast.success(t.status === 'published' ? 'Template published 🎉' : `Template ${t.status}`);
      void qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError,
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<Envelope<Template>>(`/templates/${id}/duplicate`)).data.data,
    onSuccess: () => {
      toast.success('Template duplicated');
      void qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError,
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/templates/${id}`)).data,
    onSuccess: () => {
      toast.success('Template deleted');
      void qc.invalidateQueries({ queryKey: ['templates'] });
    },
    onError,
  });
}

/* ------------------------------------------------------------------ assets */

export function useAssets(filters: { kind?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      const res = await api.get<Envelope<Asset[]>>('/assets', {
        params: { limit: 100, ...filters, search: filters.search || undefined },
      });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

/** Editor asset browser: paged library with filter/sort + infinite scrolling. */
export function useInfiniteAssets(filters: {
  kind?: string;
  search?: string;
  sort?: 'newest' | 'oldest';
}) {
  return useInfiniteQuery({
    queryKey: ['assets', 'infinite', filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<Envelope<Asset[]>>('/assets', {
        params: {
          page: pageParam,
          limit: 30,
          kind: filters.kind || undefined,
          search: filters.search || undefined,
          sort: filters.sort === 'oldest' ? 'createdAt' : '-createdAt',
        },
      });
      return { items: res.data.data, meta: res.data.meta! };
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

/** Resolve document assetIds to original URLs (admins resolve anything). */
export function useResolveAssets(ids: string[]) {
  return useQuery({
    queryKey: ['assets', 'resolve', [...ids].sort()],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (await api.post<Envelope<Asset[]>>('/assets/resolve', { ids })).data.data,
  });
}

export function useUploadAssets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, folder }: { files: FileList | File[]; folder?: string }) => {
      const form = new FormData();
      for (const file of Array.from(files)) form.append('files', file);
      if (folder) form.append('folder', folder);
      return (await api.post<Envelope<Asset[]>>('/assets', form)).data.data;
    },
    onSuccess: (assets) => {
      toast.success(`Uploaded ${assets.length} file${assets.length === 1 ? '' : 's'}`);
      void qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError,
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/assets/${id}`)).data,
    onSuccess: () => {
      toast.success('Asset deleted');
      void qc.invalidateQueries({ queryKey: ['assets'] });
    },
    onError,
  });
}

/* ------------------------------------------------------------------- fonts */

export function useFonts() {
  return useQuery({
    queryKey: ['fonts'],
    staleTime: 5 * 60_000, // font families change rarely — avoid refetch churn
    queryFn: async () => (await api.get<Envelope<Font[]>>('/fonts')).data.data,
  });
}

export function useUploadFont() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ family, files }: { family: string; files: FileList | File[] }) => {
      const form = new FormData();
      form.append('family', family);
      for (const file of Array.from(files)) form.append('files', file);
      return (await api.post<Envelope<Font>>('/fonts', form)).data.data;
    },
    onSuccess: (font) => {
      toast.success(`Font "${font.family}" uploaded`);
      void qc.invalidateQueries({ queryKey: ['fonts'] });
    },
    onError,
  });
}

export function useDeleteFont() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/fonts/${id}`)).data,
    onSuccess: () => {
      toast.success('Font deleted');
      void qc.invalidateQueries({ queryKey: ['fonts'] });
    },
    onError,
  });
}

/* ------------------------------------------------------------------- users */

export function useUsers(search = '') {
  return useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const res = await api.get<Envelope<User[]>>('/users', {
        params: { limit: 50, search: search || undefined },
      });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.patch<Envelope<User>>(`/users/${id}/active`, { isActive })).data.data,
    onSuccess: (user) => {
      toast.success(user.isActive ? 'Account activated' : 'Account deactivated');
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError,
  });
}

/* ---------------------------------------------------------------- activity */

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async () =>
      (await api.get<Envelope<ActivityLog[]>>('/dashboard/activity', { params: { limit: 50 } }))
        .data.data,
  });
}
