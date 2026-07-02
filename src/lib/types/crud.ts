import type { Component } from 'svelte';
import type { FullAutoFill } from 'svelte/elements';
import type { AttributeType } from '$lib/types/attribute.js';
import type { CellComponent, CellFormatter } from '$lib/types/table.js';

export type ColumnDefinition<T extends object = Record<string, unknown>> = {
  [K in keyof T & string]: {
    attribute: K;
    title?: string;
    type?: AttributeType;
    component?: CellComponent<T, T[K]>;
    formatter?: CellFormatter<T, T[K]>;
    sortable?: boolean;
    filterable?: boolean;
  };
}[keyof T & string];

export interface FieldDefinition<T extends object = Record<string, unknown>> {
  attribute: keyof T & string;
  title?: string;
  type?: AttributeType;
  required?: boolean;
  autocomplete?: FullAutoFill;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any;
  options?: { value: string; label: string }[];
}

export interface ActionConfiguration<T extends object = Record<string, unknown>> {
  enabled?: boolean;
  label?: string;
  endpoint?: string;
  confirm?: boolean;
  callback?: (items: T[]) => void | Promise<void>;
}

export interface CustomAction<T extends object = Record<string, unknown>> {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  endpoint?: string;
  condition?: (item: T) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  view: Component<any>;
}

export interface RowAction<T extends object = Record<string, unknown>> {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  class?: string;
  condition?: (item: T) => boolean;
  run: (item: T) => void;
}
