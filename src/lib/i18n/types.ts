export interface RuneforgeStrings {
	// Paginator
	showing: (start: number, end: number, total: number) => string;

	// Table header
	actions: string;

	// Column filter
	filter: string;
	filterColumn: (column: string) => string;
	filterPlaceholder: string;
	clearFilter: string;
	emptyValue: string;

	// Calendar navigation (ColumnFilter + Field datetime picker)
	previous: string;
	next: string;

	// Select
	selectPlaceholder: string;
	selectSearch: string;
	selectSearching: string;
	selectNoResults: string;

	// CRUD List row actions
	view: string;
	edit: string;
	delete: string;

	// CRUD List create button verb (entity name appended by the component)
	create: string;

	// CRUD List generic free-text search (search prop)
	searchPlaceholder: string;

	// CRUD List export menu
	export: string;
	exportCsv: string;
	exportExcel: string;

	// CRUD forms
	save: string;
	saveAndContinue: string;
	cancel: string;
	back: string;

	// CRUD delete confirmation
	confirm: string;
	deleteConfirm: (count: number, actionLabel: string) => string;

	// CRUD validation
	required: (field: string) => string;
	invalidNumber: (field: string) => string;
	integer: (field: string) => string;
	min: (field: string, min: number) => string;
	max: (field: string, max: number) => string;
	minLength: (field: string, min: number) => string;
	maxLength: (field: string, max: number) => string;
	pattern: (field: string) => string;
	serverError: string;
}
