/**
 * Bootstrap Icons adapter for runeforge.
 *
 * Requires `svelte-bootstrap-icons` to be installed in the consuming project:
 *   npm install svelte-bootstrap-icons
 *
 * Usage:
 *   import { setIconSet } from 'runeforge';
 *   import { bootstrapIconSet } from 'runeforge/icons/sets/bootstrap';
 *   setIconSet(bootstrapIconSet);
 */
import * as Icons from 'svelte-bootstrap-icons';
import type { CRUDIconSet, IconComponent } from '$lib/icons/types.js';

const {
  ChevronExpand, CaretUpFill, CaretDownFill, Funnel, FunnelFill,
  Plus, Eye, PencilSquare, Trash3, HouseDoor, Folder, EyeSlash,
} = Icons;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asIcon(c: any): IconComponent { return c as IconComponent; }

export const bootstrapIconSet: CRUDIconSet = {
  sortNone: asIcon(ChevronExpand),
  sortAsc: asIcon(CaretUpFill),
  sortDesc: asIcon(CaretDownFill),
  filter: asIcon(Funnel),
  filterActive: asIcon(FunnelFill),
  create: asIcon(Plus),
  view: asIcon(Eye),
  edit: asIcon(PencilSquare),
  delete: asIcon(Trash3),
  home: asIcon(HouseDoor),
  folder: asIcon(Folder),
  passwordShow: asIcon(Eye),
  passwordHide: asIcon(EyeSlash),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByName: (name: string) => asIcon((Icons as Record<string, any>)[name]) ?? null,
};
