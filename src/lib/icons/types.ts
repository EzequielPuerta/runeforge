import type { Component } from 'svelte';

export type IconComponent = Component<{ size?: string | number; class?: string }>;
export type IconByNameComponent = Component<{ name: string; size?: string | number; class?: string }>;

export interface CRUDIconSet {
  sortNone: IconComponent;
  sortAsc: IconComponent;
  sortDesc: IconComponent;
  filter: IconComponent;
  filterActive: IconComponent;
  create: IconComponent;
  view: IconComponent;
  edit: IconComponent;
  delete: IconComponent;
  home: IconComponent;
  folder: IconComponent;
  passwordShow: IconComponent;
  passwordHide: IconComponent;
  renderByName?: IconByNameComponent;
}
