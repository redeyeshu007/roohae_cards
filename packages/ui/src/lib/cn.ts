/**
 * FILE PURPOSE:
 * Tailwind CSS class merging utility.
 *
 * MAIN RESPONSIBILITY:
 * Merges conditional CSS class names using clsx and resolves conflicting Tailwind utility classes with twMerge.
 *
 * CONNECTED SYSTEMS:
 * - All UI components across @roohae/ui, apps/admin, and apps/user.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// CLASS MERGE UTILITY:
// Combines class lists and deduplicates conflicting Tailwind utilities.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
