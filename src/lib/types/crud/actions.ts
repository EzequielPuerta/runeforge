import type { Component } from 'svelte';

/** A create-form button whose visibility, label and styling can all be
 * overridden — `enabled` falls back to the button's own default (see
 * `continue`/`duplication` on `ActionConfiguration`), `label` falls back to
 * the matching i18n string, and `class` adds extra classes (e.g. Tailwind
 * utilities) alongside the button's default variant. */
export interface CreateFormButtonConfiguration {
	enabled?: boolean;
	label?: string;
	class?: string;
}

/** The "Duplicate" button's configuration — a `CreateFormButtonConfiguration`
 * plus which attributes to leave out of the duplicated draft. */
export interface DuplicationButtonConfiguration extends CreateFormButtonConfiguration {
	/** Attribute names reset to the field's `default` instead of copying the
	 * source instance's value — e.g. a publication date that should depend on
	 * when the copy is itself published, not on when the original was. */
	omit?: string[];
}

export interface ActionConfiguration<T extends object = Record<string, unknown>> {
	enabled?: boolean;
	label?: string;
	endpoint?: string;
	confirm?: boolean;
	callback?: (items: T[]) => void | Promise<void>;
	/** The "Save and continue" button, shown alongside Save/Cancel.
	 * - Create form: submits to the same `endpoint` and then blanks the form
	 *   so the user can create another record from scratch. Enabled by
	 *   default — pass `{ enabled: false }` to hide it.
	 * - Update form: submits to the same `endpoint` and then loads the record
	 *   that follows the current one in the list into the same form, so
	 *   several records can be edited in a row — handy after a bulk import.
	 *   Falls back to reloading the current instance when there is no next
	 *   one. Disabled by default — pass `{ enabled: true }` to show it. */
	continue?: CreateFormButtonConfiguration;
	/** Shows a "Duplicate" button alongside Save/Cancel.
	 * - Create form: submits to the same `endpoint`, but — unlike "Save and
	 *   continue", which blanks the form — leaves the just-submitted values in
	 *   place so the user can tweak a few fields and save again as a new
	 *   record.
	 * - Update form: submits the edit to the same `endpoint`, then opens the
	 *   create form pre-filled with the just-saved instance's values, so a new
	 *   record can be started from it without retyping everything.
	 * Disabled by default — pass `{ enabled: true }` to show it. */
	duplication?: DuplicationButtonConfiguration;
}

export interface CustomAction<T extends object = Record<string, unknown>> {
	label: string;
	/** Required unless `toggle` is set, which renders the action as a switch
	 * instead of an icon button. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	/** Renders the row action as a real daisyUI toggle switch reflecting the
	 * item's current on/off state, instead of an icon button. Takes
	 * precedence over `icon` when both are set.
	 *
	 * The switch is controlled, not editable directly: clicking it never
	 * flips its own checked state, it still just calls `run` (opening `view`
	 * or navigating via `href`) like any other action. It only visually
	 * flips once the underlying item's data actually changes — e.g. after
	 * the action's modal confirms and the list reloads. */
	toggle?: (item: T) => boolean;
	/** Extra class(es) on the row action's button/switch — e.g. to color a
	 * `toggle` by the item's own state (`toggle-success`/`toggle-error`).
	 * Pass a function to resolve it per item; a plain string applies to
	 * every row alike. */
	class?: string | ((item: T) => string);
	endpoint?: string;
	condition?: (item: T) => boolean;
	/** Renders as a modal-like panel when the action runs. Mutually exclusive
	 * with `href` — provide exactly one of the two. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	view?: Component<any>;
	/** Navigates to the given URL instead of opening `view`. Takes priority
	 * over `view` if both are somehow set. */
	href?: (item: T) => string;
}

export interface RowAction<T extends object = Record<string, unknown>> {
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	/** See `CustomAction.toggle` — same controlled-switch rendering. */
	toggle?: (item: T) => boolean;
	/** See `CustomAction.class`. */
	class?: string | ((item: T) => string);
	condition?: (item: T) => boolean;
	run: (item: T) => void;
}

export interface BaseCustomBulkAction<T extends object = Record<string, unknown>> {
	/** Visible text on the button. Omit for an icon-only button — pass
	 * `tooltip` in that case so the action still has an accessible name and a
	 * hover hint, since `label` is what a collapsed "Acciones" menu item and
	 * the button's default `title`/`aria-label` fall back to otherwise. */
	label?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
	/** Hover title shown on the button. Defaults to `label`. Set this
	 * explicitly when `label` is omitted (icon-only button) so there's still
	 * a hint on hover and an accessible name. */
	tooltip?: string;
	variant?: string;
	condition?: (items: T[]) => boolean;
}

export interface ViewBasedCustomBulkAction<
	T extends object = Record<string, unknown>
> extends BaseCustomBulkAction<T> {
	kind: 'view';
	/** Renders as a modal-like panel when the action runs, instead of POSTing
	 * to an endpoint once per selected item, mirroring `CustomAction.view`.
	 *
	 * A `view` action never requires a pre-existing selection: the button is
	 * enabled even with nothing selected. The component receives the current
	 * selection as `items` (possibly empty). */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	view: Component<any>;
}

export interface EndpointBasedCustomBulkAction<
	T extends object = Record<string, unknown>
> extends BaseCustomBulkAction<T> {
	kind: 'endpoint';
	/** POSTed once per selected item (`id` set in the FormData body), then
	 * `invalidateAll()`s. */
	endpoint: string;
	confirm?: boolean;
}

/** A toolbar action operating on the current selection — either a `view`
 * (opens a modal-like panel, e.g. an import wizard) or an `endpoint`
 * (POSTed once per selected item). The required `kind` discriminant picks
 * which one: `'view'` brings `view` and forbids `endpoint`/`confirm`;
 * `'endpoint'` brings `endpoint`/`confirm` and forbids `view` — see
 * `ViewBasedCustomBulkAction` / `EndpointBasedCustomBulkAction`. */
export type CustomBulkAction<T extends object = Record<string, unknown>> =
	| ViewBasedCustomBulkAction<T>
	| EndpointBasedCustomBulkAction<T>;

/** Groups the list view's row-level and selection-level custom actions —
 * `custom` replaces the old top-level `actions` prop, `bulk` replaces
 * `customBulkActions`. */
export interface ListActions<T extends object = Record<string, unknown>> {
	/** Extra per-row actions — see Custom row actions. */
	custom?: CustomAction<T>[];
	/** Extra actions on the current selection — see Custom bulk actions. */
	bulk?: CustomBulkAction<T>[];
}
