<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { onMount } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import Select from '$lib/components/form/Select.svelte';
	import MultiSelect from '$lib/components/form/MultiSelect.svelte';
	import Tree from '$lib/components/form/Tree.svelte';
	import EmbeddedField from '$lib/components/crud/EmbeddedField.svelte';
	import { fieldLabel, initials } from '$lib/components/crud/utils/misc.js';
	import type { FieldDefinition } from '$lib/types/crud.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	onMount(() => {
		import('cally');
	});

	let {
		field,
		record = $bindable({} as Record<string, unknown>),
		error = '',
		readonly = false,
		class: className = ''
	}: {
		field: FieldDefinition<T>;
		record?: Record<string, unknown>;
		error?: string;
		readonly?: boolean;
		class?: string;
	} = $props();

	const datePopId = $props.id();
	const dateAnchorName = `--date-anchor-${datePopId}`;
	let datePopoverEl: HTMLElement | undefined = $state();
	let calendarDateEl: (HTMLElement & { value: string }) | undefined = $state();

	const name = $derived(readonly ? undefined : field.attribute);
	const labelText = $derived(fieldLabel(field));
	let filePreview = $state<string | null>(null);

	function onFileChange(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		if (filePreview) URL.revokeObjectURL(filePreview);
		filePreview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
	}

	$effect(() => () => {
		if (filePreview) URL.revokeObjectURL(filePreview);
	});

	const saved = $derived(record[field.attribute]);
	const preview = $derived(filePreview ?? (typeof saved === 'string' && saved ? saved : null));
	const avatarInitials = $derived(initials(record.firstName as string, record.lastName as string));
	const displayValue = $derived(saved == null ? '' : String(saved));
	// Only for readonly branches with no other resolution mechanism (select/
	// multiselect/tree already resolve their own label from `options`, and
	// some of their formatters return HTML meant for a table cell, not plain
	// input text). Falls back to `displayValue` so a value with no formatter
	// still renders instead of going blank.
	const formattedValue = $derived(
		readonly && field.formatter ? field.formatter(saved, record) : displayValue
	);
	const selectOptions = $derived(
		field.dependentOptions ? field.dependentOptions(record) : (field.options ?? [])
	);
	const fieldDisabled = $derived(field.disabled ? field.disabled(record) : false);
	const fieldRequired = $derived(
		typeof field.required === 'function' ? field.required(record) : !!field.required
	);
	const fieldHidden = $derived(
		typeof field.hidden === 'function' ? field.hidden(record) : !!field.hidden
	);
	const isMultiValued = $derived(field.type === 'multiselect' || field.type === 'tree');

	// cally's `change` event doesn't bubble, so the usual `onchange={...}` prop
	// never fires — Svelte 5 delegates events like `change` to a listener on
	// a shared ancestor, which only ever sees events that bubble up to it.
	// Attaching directly on the element (same fix ColumnFilter's date-range
	// picker already uses) sidesteps delegation entirely.
	$effect(() => {
		if (!calendarDateEl) return;
		function handler() {
			if (fieldDisabled) return;
			setDateTime(calendarDateEl!.value, timePart);
			datePopoverEl?.hidePopover();
		}
		calendarDateEl.addEventListener('change', handler);
		return () => calendarDateEl?.removeEventListener('change', handler);
	});

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	// ISO (yyyy-mm-dd) <-> display (dd/mm/yyyy) conversion and typing mask.
	function isoDateToDisplay(iso: string): string {
		const [year, month, day] = iso.split('-');
		return `${day}/${month}/${year}`;
	}

	function displayToIsoDate(display: string): string | null {
		const match = display.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (!match) return null;
		const [, dd, mm, yyyy] = match;
		const day = Number(dd);
		const month = Number(mm);
		const year = Number(yyyy);
		// Rejects invalid dates (e.g. 31/02).
		const date = new Date(Date.UTC(year, month - 1, day));
		if (
			date.getUTCFullYear() !== year ||
			date.getUTCMonth() !== month - 1 ||
			date.getUTCDate() !== day
		) {
			return null;
		}
		return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
	}

	// Inserts "/" as digits are typed: "21" -> "21/", "211" -> "21/1".
	function maskDateDigits(digits: string): string {
		const day = digits.slice(0, 2);
		const month = digits.slice(2, 4);
		const year = digits.slice(4, 8);
		let out = day;
		if (digits.length >= 2) out += '/';
		out += month;
		if (digits.length >= 4) out += '/';
		return out + year;
	}

	// `record[field.attribute]` may be empty, a bare "YYYY-MM-DD" (freshly
	// picked, before any time is set) or a full ISO datetime (loaded from an
	// existing instance) — parsed once here so the date button, the time
	// input and cally's own `value` all derive from the same local-time
	// breakdown instead of each re-parsing the raw string their own way.
	const parsedDateTime = $derived.by(() => {
		const raw = record[field.attribute];
		if (raw == null || raw === '') return null;
		const d = new Date(String(raw));
		return isNaN(d.getTime()) ? null : d;
	});
	const datePart = $derived(
		parsedDateTime
			? `${parsedDateTime.getFullYear()}-${pad(parsedDateTime.getMonth() + 1)}-${pad(parsedDateTime.getDate())}`
			: ''
	);
	const timePart = $derived(
		parsedDateTime ? `${pad(parsedDateTime.getHours())}:${pad(parsedDateTime.getMinutes())}` : ''
	);

	function setDateTime(nextDatePart: string, nextTimePart: string) {
		record[field.attribute] = nextDatePart ? `${nextDatePart}T${nextTimePart || '00:00'}` : '';
	}

	// Typed display text for the date part, synced from `datePart`.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let dateTextValue = $state('');
	$effect(() => {
		dateTextValue = datePart ? isoDateToDisplay(datePart) : '';
	});

	function onDateTextInput(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		const prevDigits = dateTextValue.replace(/\D/g, '');
		let digits = raw.replace(/\D/g, '');
		// Drops one extra digit when backspacing over an inserted "/".
		if (raw.length < dateTextValue.length && digits.length === prevDigits.length) {
			digits = digits.slice(0, -1);
		}
		digits = digits.slice(0, 8);
		dateTextValue = maskDateDigits(digits);
		if (!digits) {
			setDateTime('', timePart);
			return;
		}
		const parsed = displayToIsoDate(dateTextValue);
		if (parsed) setDateTime(parsed, timePart);
	}

	function onDateTextBlur() {
		if (!dateTextValue.trim()) {
			setDateTime('', timePart);
			return;
		}
		if (!displayToIsoDate(dateTextValue)) {
			// Discards invalid input.
			dateTextValue = datePart ? isoDateToDisplay(datePart) : '';
		}
	}

	$effect(() => {
		if (!field.dependentOptions || isMultiValued) return;
		const current = record[field.attribute];
		if (current && !selectOptions.some((o) => o.value === String(current))) {
			record[field.attribute] = '';
		}
	});

	$effect(() => {
		if (!field.dependentOptions || !isMultiValued) return;
		const current = record[field.attribute];
		if (!Array.isArray(current)) return;
		const validValues = new Set(selectOptions.map((o) => o.value));
		const pruned = current.filter((v) => validValues.has(String(v)));
		if (pruned.length !== current.length) {
			record[field.attribute] = pruned;
		}
	});
</script>

{#if !fieldHidden}
	<div class="flex flex-col gap-1 {className}">
		{#if field.type === 'file'}
			<div class="flex justify-center">
				<Avatar
					src={preview}
					text={avatarInitials}
					alt={labelText}
					class="w-20 rounded-full"
					textClass="text-xl"
				/>
			</div>
		{/if}

		<Label
			text={labelText}
			for={field.attribute}
			capitalize={true}
			required={fieldRequired && !readonly}
		/>

		{#if field.type === 'boolean'}
			<input
				type="checkbox"
				id={field.attribute}
				{name}
				class="toggle toggle-primary"
				checked={!!saved}
				disabled={readonly || fieldDisabled}
				onchange={(e) => {
					record[field.attribute] = (e.currentTarget as HTMLInputElement).checked;
				}}
			/>
		{:else if field.type === 'file'}
			{#if !readonly}
				<input
					type="file"
					id={field.attribute}
					{name}
					class="file-input file-input-bordered w-full"
					class:file-input-error={!!error}
					disabled={fieldDisabled}
					onchange={onFileChange}
				/>
			{/if}
			<!-- read-only file value is shown as the avatar above -->
		{:else if field.type === 'select'}
			{#if readonly}
				<input
					type="text"
					id={field.attribute}
					class="input input-bordered w-full"
					value={selectOptions.find((o) => o.value === String(saved))?.label ?? displayValue}
					disabled
				/>
			{:else}
				<Select
					id={field.attribute}
					name={field.attribute}
					bind:value={record[field.attribute] as string}
					options={selectOptions}
					search={field.search}
					placeholder={field.placeholder}
					disabled={fieldDisabled}
					{error}
				/>
			{/if}
		{:else if field.type === 'datetime'}
			{#if readonly}
				<input
					type="text"
					id={field.attribute}
					class="input input-bordered w-full"
					value={formattedValue}
					disabled
				/>
			{:else}
				<input
					type="hidden"
					{name}
					value={String(record[field.attribute] ?? '')}
					disabled={fieldDisabled}
				/>
				<div class="flex gap-2">
					<div class="relative flex-1" style="anchor-name:{dateAnchorName}">
						<input
							type="text"
							id={field.attribute}
							placeholder={field.placeholder ?? 'dd/mm/aaaa'}
							value={dateTextValue}
							oninput={onDateTextInput}
							onblur={onDateTextBlur}
							autocomplete="off"
							disabled={fieldDisabled}
							class="input input-bordered w-full pr-9"
							class:input-error={!!error}
						/>
						<button
							type="button"
							popovertarget={datePopId}
							aria-label={strings.chooseDate}
							disabled={fieldDisabled}
							class="absolute inset-y-0 right-0 flex items-center px-2.5 text-base-content/50 hover:text-base-content disabled:pointer-events-none disabled:opacity-40"
						>
							<svg
								class="size-4"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" />
								<path d="M16 2v4M8 2v4M3 10h18" />
							</svg>
						</button>
					</div>
					<input
						type="time"
						class="input input-bordered w-32 shrink-0"
						value={timePart}
						disabled={fieldDisabled || !record[field.attribute]}
						onchange={(e) => setDateTime(datePart, (e.currentTarget as HTMLInputElement).value)}
					/>
				</div>
				<div
					popover="auto"
					id={datePopId}
					bind:this={datePopoverEl}
					style="position-anchor:{dateAnchorName}; position-try-fallbacks:flip-block;"
					class="dropdown mt-1 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-lg"
				>
					<calendar-date class="cally" bind:this={calendarDateEl} value={datePart}>
						<svg
							aria-label={strings.previous}
							class="fill-current size-4"
							{...{ slot: 'previous' }}
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"><path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg
						>
						<svg
							aria-label={strings.next}
							class="fill-current size-4"
							{...{ slot: 'next' }}
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"><path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg
						>
						<calendar-month></calendar-month>
					</calendar-date>
				</div>
			{/if}
		{:else if field.type === 'textarea'}
			{#if readonly}
				<textarea
					id={field.attribute}
					rows={field.rows}
					class="textarea textarea-bordered bg-base-100 w-full"
					value={formattedValue}
					disabled
				></textarea>
			{:else}
				<textarea
					id={field.attribute}
					{name}
					rows={field.rows}
					placeholder={field.placeholder ?? ''}
					bind:value={record[field.attribute]}
					class="textarea textarea-bordered bg-base-100 w-full"
					class:textarea-error={!!error}
					disabled={fieldDisabled}
				></textarea>
			{/if}
		{:else if field.type === 'embedded'}
			<EmbeddedField {field} bind:record {readonly} />
		{:else if field.type === 'multiselect'}
			{#if readonly}
				<input
					type="text"
					id={field.attribute}
					class="input input-bordered w-full"
					value={(Array.isArray(saved) ? saved : [])
						.map((v) => selectOptions.find((o) => o.value === String(v))?.label ?? String(v))
						.join(', ')}
					disabled
				/>
			{:else}
				<MultiSelect
					id={field.attribute}
					name={field.attribute}
					bind:value={record[field.attribute] as string[]}
					options={selectOptions}
					search={field.search}
					placeholder={field.placeholder}
					disabled={fieldDisabled}
					{error}
				/>
			{/if}
		{:else if field.type === 'tree'}
			{#if readonly}
				<input
					type="text"
					id={field.attribute}
					class="input input-bordered w-full"
					value={(Array.isArray(saved) ? saved : [])
						.map((v) => selectOptions.find((o) => o.value === String(v))?.label ?? String(v))
						.join(', ')}
					disabled
				/>
			{:else}
				<Tree
					name={field.attribute}
					bind:value={record[field.attribute] as string[]}
					options={selectOptions}
					disabled={fieldDisabled}
					defaultExpanded={field.defaultExpanded ?? true}
				/>
			{/if}
		{:else if readonly}
			{#if field.formatter}
				<div
					id={field.attribute}
					class="input input-bordered w-full bg-base-200 border-base-200 text-base-content/40 shadow-none cursor-not-allowed"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html formattedValue}
				</div>
			{:else}
				<input
					type={field.type ?? 'text'}
					id={field.attribute}
					class="input input-bordered w-full"
					value={formattedValue}
					disabled
				/>
			{/if}
		{:else}
			<input
				type={field.type ?? 'text'}
				id={field.attribute}
				{name}
				placeholder={field.placeholder ?? ''}
				bind:value={record[field.attribute]}
				autocomplete={field.autocomplete}
				step={field.type === 'number' ? 'any' : undefined}
				class="input input-bordered w-full"
				class:input-error={!!error}
				disabled={fieldDisabled}
			/>
		{/if}

		{#if error}
			<span class="text-error text-xs">{error}</span>
		{/if}
	</div>
{/if}
