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
import ChevronExpand from 'svelte-bootstrap-icons/lib/ChevronExpand.svelte';
import CaretUpFill from 'svelte-bootstrap-icons/lib/CaretUpFill.svelte';
import CaretDownFill from 'svelte-bootstrap-icons/lib/CaretDownFill.svelte';
import Funnel from 'svelte-bootstrap-icons/lib/Funnel.svelte';
import FunnelFill from 'svelte-bootstrap-icons/lib/FunnelFill.svelte';
import Plus from 'svelte-bootstrap-icons/lib/Plus.svelte';
import Eye from 'svelte-bootstrap-icons/lib/Eye.svelte';
import PencilSquare from 'svelte-bootstrap-icons/lib/PencilSquare.svelte';
import Trash3 from 'svelte-bootstrap-icons/lib/Trash3.svelte';
import HouseDoor from 'svelte-bootstrap-icons/lib/HouseDoor.svelte';
import Folder from 'svelte-bootstrap-icons/lib/Folder.svelte';
import EyeSlash from 'svelte-bootstrap-icons/lib/EyeSlash.svelte';
import X from 'svelte-bootstrap-icons/lib/X.svelte';
import Download from 'svelte-bootstrap-icons/lib/Download.svelte';
import GripVertical from 'svelte-bootstrap-icons/lib/GripVertical.svelte';
import type { CRUDIconSet, IconComponent } from '$lib/icons/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asIcon(c: any): IconComponent { return c as IconComponent; }

export const bootstrapIconSet: CRUDIconSet = {
  sortNone: asIcon(ChevronExpand),
  sortAsc: asIcon(CaretUpFill),
  sortDesc: asIcon(CaretDownFill),
  filter: asIcon(Funnel),
  filterActive: asIcon(FunnelFill),
  clear: asIcon(X),
  create: asIcon(Plus),
  view: asIcon(Eye),
  edit: asIcon(PencilSquare),
  delete: asIcon(Trash3),
  home: asIcon(HouseDoor),
  folder: asIcon(Folder),
  passwordShow: asIcon(Eye),
  passwordHide: asIcon(EyeSlash),
  download: asIcon(Download),
  grip: asIcon(GripVertical),
};
