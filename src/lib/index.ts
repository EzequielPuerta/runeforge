// Types
export type { BreadcrumbItem } from './types/breadcrumb.js';
export { AttributeType } from './types/attribute.js';
export type {
	AttributeMetadata,
	InterfaceMetadata,
	SelectOption,
	OptionsResolver,
	FormatterResolver,
	EmbeddedItemLabelResolver
} from './types/attribute.js';
export type {
	CellProps,
	CellComponent,
	CellFormatter,
	SortDirection,
	IndexedRow,
	DistinctEntry,
	PaginatedEnvelope,
	ServerPagination,
	FilterSnapshot,
	TableQuery
} from './types/table.js';
export type {
	ColumnDefinition,
	FieldDefinition,
	ActionConfiguration,
	CustomAction,
	BaseCustomBulkAction,
	ViewBasedCustomBulkAction,
	EndpointBasedCustomBulkAction,
	CustomBulkAction,
	RowAction,
	SearchConfiguration
} from './types/crud.js';

// Config
export type { RuneforgeConfig } from './config/context.js';
export { setConfig, getConfig } from './config/context.js';

// Icon system
export type { CRUDIconSet, IconComponent } from './icons/types.js';
export { setIconSet, getIconSet } from './icons/context.js';
export { defaultIconSet } from './icons/sets/default.js';
export { bootstrapIconSet } from './icons/sets/bootstrap.js';

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
export { default as MultiSelect } from './components/form/MultiSelect.svelte';
export { default as Tree } from './components/form/Tree.svelte';
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
export { SortState, FilterState, snapshotFilter } from './components/table/state.svelte.js';
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
export { default as EmbeddedField } from './components/crud/EmbeddedField.svelte';
export { default as Header } from './components/common/Header.svelte';
export { default as AvatarCell } from './components/crud/columns/Avatar.svelte';
export { default as IconCell } from './components/crud/columns/Icon.svelte';
export { default as CRUDList } from './components/crud/views/List.svelte';
export { default as CRUDCreate } from './components/crud/views/Create.svelte';
export { default as CRUDRead } from './components/crud/views/Read.svelte';
export { default as CRUDUpdate } from './components/crud/views/Update.svelte';
export { default as SearchInput } from './components/crud/SearchInput.svelte';

// CRUD utilities
export { AUTO_EXCLUDED } from './components/crud/utils/constants.js';
export {
	resolveOptions,
	resolveFormatter,
	truncateFormatter,
	inferType,
	buildFieldDefinitions
} from './components/crud/utils/resolution.js';
export { fieldLabel, initials } from './components/crud/utils/misc.js';
export {
	formatBoolean,
	formatDatetime,
	formatInstance
} from './components/crud/utils/formatters.js';
export { groupFields } from './components/crud/utils/grouping.js';
export type { FieldGroup } from './components/crud/utils/grouping.js';
export { validateAll } from './components/crud/utils/validation.js';
export { emptyRecord, defaultItemLabel } from './components/crud/utils/embedded.js';
export { buildChildrenByParent, collectDescendantIds } from './components/crud/utils/tree.js';
