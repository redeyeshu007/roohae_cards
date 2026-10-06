/**
 * FILE PURPOSE:
 * Central entry point and public export barrel for @roohae/ui.
 *
 * MAIN RESPONSIBILITY:
 * Exports editor workspace components, sidebars, properties panels, basic controls,
 * utility functions (cn), and API client factories used across user and admin frontend apps.
 *
 * CONNECTED SYSTEMS:
 * - apps/admin (imports EditorWorkspace, UI primitives, createApiClient)
 * - apps/user (imports EditorWorkspace, UI primitives, createApiClient)
 */

// lib
export { cn } from './lib/cn';
export { createApiClient, apiErrorMessage, unwrap, type TokenStore } from './lib/api';
export { createAuthStore, type AuthState, type AuthStore } from './lib/auth-store';
export { AppProviders } from './lib/providers';

// primitives
export * from './components/basics';
export * from './components/overlays';
export * from './components/controls';

// editor
export { EditorWorkspace, type EditorWorkspaceProps } from './editor/EditorWorkspace';
export { type SaveStatus } from './editor/TopBar';
export { type AssetBrowserProps, type SidebarSection } from './editor/LeftSidebar';
export {
  PlaceholdersPanel,
  type PlaceholderBrowserProps,
  type GalleryAssetInfo,
} from './editor/PlaceholdersPanel';
export { EditableFieldsPanel } from './editor/EditableFieldsPanel';
export { EditorSkeleton } from './editor/EditorSkeleton';
export { ColorField } from './editor/ColorField';
