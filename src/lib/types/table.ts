import type { Component } from 'svelte';

export type SortDirection = 'asc' | 'desc';
export type IndexedRow<T> = { row: T; index: number };
export type DistinctEntry<T> = { key: string; row: T };

export interface CellProps<T extends object = Record<string, unknown>, V = unknown> {
  value: V;
  row: T;
}

export type CellComponent<T extends object = Record<string, unknown>, V = unknown> =
  Component<CellProps<T, V>>;

export type CellFormatter<T extends object = Record<string, unknown>, V = unknown> =
  (value: CellProps<T, V>['value'], row: CellProps<T, V>['row']) => string;
