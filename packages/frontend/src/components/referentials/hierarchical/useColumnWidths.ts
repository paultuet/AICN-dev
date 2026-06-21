import { useSyncExternalStore } from "react";

/**
 * Session-only column width store for the referentials data table.
 *
 * Widths live in memory and are shared across every FieldsTable instance, so
 * resizing a column once applies it everywhere and survives expand/collapse of
 * the hierarchical nodes. It is intentionally NOT persisted: a full page reload
 * resets every column back to its default width.
 */

export const MIN_COLUMN_WIDTH = 48;

// Map of column key -> pixel width. Replaced (never mutated) on every change so
// useSyncExternalStore detects the new snapshot by reference.
let widths: Record<string, number> = {};
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setColumnWidth = (key: string, width: number) => {
  const next = Math.max(MIN_COLUMN_WIDTH, Math.round(width));
  if (widths[key] === next) return;
  widths = { ...widths, [key]: next };
  emit();
};

/**
 * Returns the shared map of session column widths. Read a width with
 * `widths[key] ?? defaultWidth` to fall back to the column default.
 */
export const useColumnWidths = (): Record<string, number> =>
  useSyncExternalStore(subscribe, () => widths);
