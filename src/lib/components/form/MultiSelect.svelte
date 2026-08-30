<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { getStrings } from '$lib/i18n/context.js';
	import { getIconSet } from '$lib/icons/context.js';
	import { defaultIconSet } from '$lib/icons/sets/default.js';
	import Button from '$lib/components/form/Button.svelte';
	import type { SearchResolver, SelectOption } from '$lib/types/attribute.js';

	const strings = getStrings();
	const icons = $derived(getIconSet() ?? defaultIconSet);

	let {
		name,
		id,
		value = $bindable([]),
		options = [],
		search: searchFn,
		searchDebounceMs = 300,
		placeholder = strings.selectPlaceholder,
		error = '',
		disabled = false,
		// When passed, the dropdown's top row selects every option instead of
		// clearing the selection (labelled `strings.selectAll` instead of
		// `placeholder`) — clearing moves to the trigger's own × button instead.
		// Left unset, existing callers keep today's behavior unchanged: top row
		// clears, no × button.
		onSelectAll
	}: {
		name?: string;
		id?: string;
		value?: string[];
		options?: SelectOption[];
		search?: SearchResolver;
		searchDebounceMs?: number;
		placeholder?: string;
		error?: string;
		disabled?: boolean;
		onSelectAll?: () => void;
	} = $props();

	const popId = $props.id();
	const anchorName = `--multiselect-anchor-${popId}`;

	let query = $state('');
	let open = $state(false);
	let containerEl: HTMLElement | undefined = $state();
	let popoverEl: HTMLElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();

	let remoteResults = $state<SelectOption[] | null>(null);
	let searching = $state(false);
	const pickedLabels = new SvelteMap<string, string>();

	let searchToken = 0;
	$effect(() => {
		if (!searchFn) return;
		const q = query.trim();
		if (!q) {
			remoteResults = null;
			searching = false;
			return;
		}
		const token = ++searchToken;
		searching = true;
		const timer = setTimeout(() => {
			searchFn(q).then((results) => {
				if (token !== searchToken) return; // stale response, a newer query took over
				remoteResults = results;
				searching = false;
			});
		}, searchDebounceMs);
		return () => clearTimeout(timer);
	});

	const filtered = $derived(
		searchFn
			? (remoteResults ?? options)
			: query.trim()
				? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
				: options
	);

	const selectedLabels = $derived(
		value.map((v) => options.find((o) => o.value === v)?.label ?? pickedLabels.get(v) ?? v)
	);
	const buttonLabel = $derived(
		value.length === 0 ? placeholder : strings.selectedCount(value.length)
	);

	function toggle(option: SelectOption) {
		if (value.includes(option.value)) {
			value = value.filter((v) => v !== option.value);
		} else {
			value = [...value, option.value];
			pickedLabels.set(option.value, option.label);
		}
	}

	function openPopover() {
		open = true;
		query = '';
		popoverEl?.showPopover();
	}

	function clear() {
		value = [];
		pickedLabels.clear();
		query = '';
	}

	function onToggle(e: Event) {
		if ((e as ToggleEvent).newState === 'closed') {
			open = false;
			query = '';
		}
	}

	// Escape can be pressed while an option button has focus (not just the
	// text input), so this is wired at the container level rather than on
	// the input alone — otherwise picking an option and then hitting Escape
	// would leave the popover open with nothing listening for the key.
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.target === inputEl) {
			// The trigger used to be a plain button, so Enter never submitted the
			// surrounding form. Now that it's a text input, guard against that.
			e.preventDefault();
		} else if (e.key === 'Escape') {
			// Also suppress the browser's native "revert to last value" behavior
			// for text inputs on Escape, which would otherwise race our own
			// close-and-restore-label update and blank the field.
			e.preventDefault();
			popoverEl?.hidePopover();
		}
	}

	const hasSelection = $derived(value.length > 0);

	function clearFromTrigger(e: MouseEvent) {
		// Stop the click from also reaching the input underneath (they're
		// overlapping siblings, not nested) so clearing doesn't focus/open the
		// dropdown at the same time.
		e.preventDefault();
		e.stopPropagation();
		clear();
	}

	// The trigger is a text input now, not a button, so it can't rely on the
	// native `popovertarget` invoker exclusion to survive its own opening
	// click (that relationship only applies to button-like elements — for a
	// text input, the click that focuses it and opens the popover would
	// immediately light-dismiss it again). `popover="manual"` opts out of
	// that dismiss behavior entirely; this handler reimplements "close when
	// focus leaves the widget" instead.
	function onFocusOut(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (!next || !containerEl?.contains(next)) {
			popoverEl?.hidePopover();
		}
	}
</script>

<!--
  The keydown/focusout handlers here are event delegation for the input and
  popover option buttons below, not interaction with this div itself — every
  actually-interactive element inside already has correct native semantics.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="relative w-full" bind:this={containerEl} onfocusout={onFocusOut} onkeydown={onKeydown}>
	{#if name}
		<input type="hidden" {name} value={JSON.stringify(value)} />
	{/if}

	<div class="relative">
		<input
			bind:this={inputEl}
			{id}
			type="text"
			class="input input-bordered w-full font-normal"
			class:input-error={!!error}
			class:opacity-40={value.length === 0 && !open}
			class:pr-8={hasSelection}
			{disabled}
			{placeholder}
			value={open ? query : buttonLabel}
			oninput={(e) => (query = e.currentTarget.value)}
			onfocus={openPopover}
			style="anchor-name:{anchorName}"
			title={selectedLabels.join(', ')}
			autocomplete="off"
		/>

		{#if hasSelection && !disabled}
			{@const Icon = icons.clear}
			<Button
				variant="ghost"
				class="btn-xs btn-square btn-circle absolute top-1/2 right-6 -translate-y-1/2"
				aria-label={strings.selectClear}
				title={strings.selectClear}
				onclick={clearFromTrigger}
			>
				<Icon class="size-3" />
			</Button>
		{/if}
	</div>

	<div
		popover="manual"
		id={popId}
		bind:this={popoverEl}
		style="position-anchor:{anchorName}; width:anchor-size(width); position-try-fallbacks:flip-block;"
		class="dropdown mt-1 rounded-box border border-base-content/10 bg-base-100 shadow-lg"
		ontoggle={onToggle}
	>
		<ul class="max-h-48 overflow-y-auto p-1">
			<li>
				<button
					type="button"
					class="w-full rounded-btn px-3 py-2 text-left text-sm text-base-content/40 hover:bg-base-200"
					onclick={onSelectAll ?? clear}
				>
					{onSelectAll ? strings.selectAll : placeholder}
				</button>
			</li>
			{#if searching}
				<li class="px-3 py-2 text-sm text-base-content/40">{strings.selectSearching}</li>
			{/if}
			{#each filtered as option (option.value)}
				{@const checked = value.includes(option.value)}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
						class:bg-primary={checked}
						class:text-primary-content={checked}
						onclick={() => toggle(option)}
					>
						<input type="checkbox" class="checkbox checkbox-sm" {checked} tabindex="-1" readonly />
						{option.label}
					</button>
				</li>
			{/each}
			{#if !searching && filtered.length === 0}
				<li class="px-3 py-2 text-sm text-base-content/40">{strings.selectNoResults}</li>
			{/if}
		</ul>
	</div>
</div>
