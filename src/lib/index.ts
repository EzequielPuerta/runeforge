// Types
export type { BreadcrumbItem } from './types/breadcrumb.js';
export { AttributeType } from './types/attribute.js';
export type {
  AttributeMetadata,
  InterfaceMetadata,
  SelectOption,
  OptionsResolver,
  FormatterResolver
} from './types/attribute.js';
export type {
  CellProps,
  CellComponent,
  CellFormatter,
  SortDirection,
  IndexedRow,
  DistinctEntry
} from './types/table.js';
export type {
  ColumnDefinition,
  FieldDefinition,
  ActionConfiguration,
  CustomAction,
  RowAction
} from './types/crud.js';

// Icon system
export type { CRUDIconSet, IconComponent, IconByNameComponent } from './icons/types.js';
export { setIconSet, getIconSet } from './icons/context.js';
export { defaultIconSet } from './icons/sets/default.js';

// i18n
export type { RuneforgeStrings } from './i18n/types.js';
export { setStrings, getStrings } from './i18n/context.js';
export { es } from './i18n/es.js';
export { en } from './i18n/en.js';

// Form components
export { default as Button } from './components/form/Button.svelte';
export { default as Label } from './components/form/Label.svelte';
export { default as Required } from './components/form/Required.svelte';
export { default as Select } from './components/form/Select.svelte';
export { default as PasswordInput } from './components/form/PasswordInput.svelte';

// Shared components
export { default as Avatar } from './components/Avatar.svelte';
export { default as Modal } from './components/Modal.svelte';
export { default as IconRenderer } from './components/IconRenderer.svelte';
export { default as Breadcrumbs } from './components/navigation/Breadcrumbs.svelte';

// Table components
export { default as PaginatedTable } from './components/table/PaginatedTable.svelte';
export { default as TableHeader } from './components/table/TableHeader.svelte';
export { default as TableBody } from './components/table/TableBody.svelte';
export { default as SortHeader } from './components/table/SortHeader.svelte';
export { default as Paginator } from './components/table/Paginator.svelte';
export { default as ColumnFilter } from './components/table/ColumnFilter.svelte';
export { SortState, FilterState } from './components/table/state.svelte.js';
export {
  cellRenderedText,
  isSortable,
  isFilterable,
  compare,
  distinctEntries
} from './components/table/utils.js';

// CRUD components
export { default as GenericCRUD } from './components/crud/GenericCRUD.svelte';
export { default as Field } from './components/crud/Field.svelte';
export { default as Header } from './components/common/Header.svelte';
export { default as AvatarCell } from './components/crud/columns/Avatar.svelte';
export { default as IconCell } from './components/crud/columns/Icon.svelte';
export { default as CRUDList } from './components/crud/views/List.svelte';
export { default as CRUDCreate } from './components/crud/views/Create.svelte';
export { default as CRUDRead } from './components/crud/views/Read.svelte';
export { default as CRUDUpdate } from './components/crud/views/Update.svelte';

// CRUD utilities
export { AUTO_EXCLUDED } from './components/crud/utils/constants.js';
export { resolveOptions, resolveFormatter, inferType } from './components/crud/utils/resolution.js';
export { fieldLabel, initials } from './components/crud/utils/misc.js';
export {
  formatBoolean,
  formatDatetime,
  formatTruncateTextUpTo,
  formatInstance
} from './components/crud/utils/formatters.js';
