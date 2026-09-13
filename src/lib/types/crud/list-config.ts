import type { TableQuery } from '$lib/types/table.js';
import type { XlsxModule } from '$lib/components/table/export.js';
import type { ReorderConfiguration } from './reorder.js';

export interface SearchConfiguration {
	param?: string;
	placeholder?: string;
	debounceMs?: number;
}

export interface ExportConfiguration<T extends object = Record<string, unknown>> {
	callback?: (query: TableQuery) => Promise<T[]>;
	xlsx?: XlsxModule;
}

/** Groups the list view's opt-in behaviors. Replaces the old top-level
 * `search`, `enableExport`/`onExport`/`xlsx` props. */
export interface ListConfig<T extends object = Record<string, unknown>> {
	/** Free-text search box — see Free-text search. */
	search?: SearchConfiguration;
	/** CSV/Excel export. Presence of this object enables the export button —
	 * even as an empty `{}` — replacing the old `enableExport` boolean. */
	export?: ExportConfiguration<T>;
	/** Drag-to-reorder rows — see Reordering rows. */
	reorder?: ReorderConfiguration<T>;
}
