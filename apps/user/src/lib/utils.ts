/**
 * FILE PURPOSE:
 * Utility functions for CSS class merging and conditional styling in the user application.
 *
 * MAIN RESPONSIBILITY:
 * Exports the standard cn() utility combining clsx with tailwind-merge for conflict-free Tailwind classes.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/* (UI components)
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
