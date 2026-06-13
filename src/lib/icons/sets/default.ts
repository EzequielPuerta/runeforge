import type { CRUDIconSet } from '$lib/icons/types.js';
import SortNone from '$lib/icons/defaults/SortNone.svelte';
import SortAsc from '$lib/icons/defaults/SortAsc.svelte';
import SortDesc from '$lib/icons/defaults/SortDesc.svelte';
import Filter from '$lib/icons/defaults/Filter.svelte';
import FilterActive from '$lib/icons/defaults/FilterActive.svelte';
import Create from '$lib/icons/defaults/Create.svelte';
import View from '$lib/icons/defaults/View.svelte';
import Edit from '$lib/icons/defaults/Edit.svelte';
import Delete from '$lib/icons/defaults/Delete.svelte';
import Home from '$lib/icons/defaults/Home.svelte';
import Folder from '$lib/icons/defaults/Folder.svelte';
import PasswordShow from '$lib/icons/defaults/PasswordShow.svelte';
import PasswordHide from '$lib/icons/defaults/PasswordHide.svelte';

export const defaultIconSet: CRUDIconSet = {
  sortNone: SortNone,
  sortAsc: SortAsc,
  sortDesc: SortDesc,
  filter: Filter,
  filterActive: FilterActive,
  create: Create,
  view: View,
  edit: Edit,
  delete: Delete,
  home: Home,
  folder: Folder,
  passwordShow: PasswordShow,
  passwordHide: PasswordHide,
};
