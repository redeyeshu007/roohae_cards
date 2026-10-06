/**
 * FILE PURPOSE:
 * React Query hooks for end-user data fetching, caching, and mutation operations.
 *
 * MAIN RESPONSIBILITY:
 * Manages queries for categories, published templates, user project list, individual projects,
 * typography fonts, asset resolution, project creation from template, saving project documents, and image replacements.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/lib/api.ts (Axios network client)
 * - apps/user/src/app/(app)/* and editor pages
 * - packages/shared data types
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Asset,
  Category,
  DesignDocument,
  Font,
  PaginationMeta,
  Project,
  Template,
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

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () =>
      (await api.get<Envelope<Category[]>>('/categories', { params: { limit: 100 } })).data.data,
  });
}

/** A single published template (draft editing sessions load this). */
export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['templates', 'detail', id],
    enabled: Boolean(id),
    staleTime: 60_000,
    queryFn: async () => (await api.get<Envelope<Template>>(`/templates/${id}`)).data.data,
  });
}

/** Published templates only — enforced server-side for the user role. */
export function useTemplates(filters: { categoryId?: string; search?: string }) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const res = await api.get<Envelope<Template[]>>('/templates', {
        params: {
          limit: 50,
          categoryId: filters.categoryId || undefined,
          search: filters.search || undefined,
        },
      });
      return res.data.data;
    },
  });
}

export function useProjects(search = '') {
  return useQuery({
    queryKey: ['projects', search],
    queryFn: async () =>
      (
        await api.get<Envelope<Project[]>>('/projects', {
          params: { limit: 50, search: search || undefined },
        })
      ).data.data,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<Envelope<Project>>(`/projects/${id}`)).data.data,
  });
}

/**
 * Explicit first Save of a draft session: creates the project (optionally
 * with the customized document) — only then does it appear in My Designs.
 */
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      templateId: string;
      title?: string;
      document?: DesignDocument;
      thumbnail?: string;
    }) => (await api.post<Envelope<Project>>('/projects', input)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
    onError,
  });
}

export function useSaveProject(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title?: string;
      document?: DesignDocument;
      thumbnail?: string;
    }) => (await api.patch<Envelope<Project>>(`/projects/${id}`, input)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'], exact: false }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/projects/${id}`)).data,
    onSuccess: () => {
      toast.success('Design deleted');
      void qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError,
  });
}

export function useFonts() {
  return useQuery({
    queryKey: ['fonts'],
    staleTime: 5 * 60_000, // font families change rarely — avoid refetch churn
    queryFn: async () => (await api.get<Envelope<Font[]>>('/fonts')).data.data,
  });
}

/**
 * Resolve the asset ids referenced by a design document to original URLs.
 * The server scopes resolution to the given project OR published template
 * plus the user's own uploads — the admin library is never exposed.
 */
export function useResolveAssets(
  ids: string[],
  scope: { projectId?: string; templateId?: string },
) {
  return useQuery({
    queryKey: ['assets', 'resolve', scope.projectId ?? scope.templateId, [...ids].sort()],
    enabled: ids.length > 0 && Boolean(scope.projectId || scope.templateId),
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (await api.post<Envelope<Asset[]>>('/assets/resolve', { ids, ...scope })).data.data,
  });
}

/**
 * Upload a replacement image for an editable placeholder (original preserved).
 * Always resolves to an array.
 */
export function useUploadReplacement() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return (await api.post<Envelope<Asset[]>>('/assets/replacements', form)).data.data;
    },
    onError,
  });
}
