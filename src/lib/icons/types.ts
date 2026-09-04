import type { Component } from 'svelte';

export type IconComponent = Component<{ size?: string | number; class?: string }>;

export interface CRUDIconSet {
  sortNone: IconComponent;
  sortAsc: IconComponent;
  sortDesc: IconComponent;
  filter: IconComponent;
  filterActive: IconComponent;
  clear: IconComponent;
  create: IconComponent;
  view: IconComponent;
  edit: IconComponent;
  delete: IconComponent;
  home: IconComponent;
  folder: IconComponent;
  passwordShow: IconComponent;
  passwordHide: IconComponent;
  download: IconComponent;
  /** Drag handle shown at the start of each row when list reordering is
   * enabled. Optional so existing custom icon sets keep compiling. */
  grip?: IconComponent;
  getByName?: (name: string) => IconComponent | null;
}
