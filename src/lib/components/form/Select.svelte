<script lang="ts">
	import { getStrings } from '$lib/i18n/context.js';
	import type { SearchResolver } from '$lib/types/attribute.js';

	const strings = getStrings();

	let {
		name,
		id,
		value = $bindable(''),
		options = [],
		search: searchFn,
		searchDebounceMs = 300,
		placeholder = strings.selectPlaceholder,
		error = '',
		disabled = false
	}: {
		name?: string;
		id?: string;
		value?: string;
		options?: { value: string; label: string }[];
		search?: SearchResolver;
		searchDebounceMs?: number;
		placeholder?: string;
		error?: string;
		disabled?: boolean;
	} = $props();

	const popId = $props.id();
	const anchorName = `--select-anchor-${popId}`;

	let query = $state('');
	let open = $state(false);
	let containerEl: HTMLElement | undefined = $state();
	let popoverEl: HTMLElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();

	// Options resolved by `searchFn` for the current query; null while no
	// server search has run yet (e.g. box just opened, query still empty).
	let remoteResults = $state<{ value: string; label: string }[] | null>(null);
	let searching = $state(false);
	// Label of whatever was last picked from `remoteResults`, kept around so the
	// closed-state input can still show it even though it isn't in `options`.
	let pickedLabel = $state<string | null>(null);

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

	const selectedLabel = $derived(
		value === '' ? '' : (options.find((o) => o.value === value)?.label ?? pickedLabel ?? '')
	);

	function openPopover() {
		open = true;
		query = '';
		popoverEl?.showPopover();
	}

	function pick(option: { value: string; label: string }) {
		value = option.value;
		pickedLabel = option.label;
		query = '';
		popoverEl?.hidePopover();
		inputEl?.blur();
	}

	function clear() {
		value = '';
		pickedLabel = null;
		query = '';
		popoverEl?.hidePopover();
		inputEl?.blur();
	}

	// Catches dismissal paths that don't go through pick()/clear() (outside
	// click, Escape), so a stale search doesn't linger for next time it opens.
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
		<input type="hidden" {name} {value} />
	{/if}

	<input
		bind:this={inputEl}
		{id}
		type="text"
		class="input input-bordered w-full font-normal"
		class:input-error={!!error}
		{disabled}
		{placeholder}
		value={open ? query : selectedLabel}
		oninput={(e) => (query = e.currentTarget.value)}
		onfocus={openPopover}
		style="anchor-name:{anchorName}"
		autocomplete="off"
	/>

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
					onclick={clear}
				>
					{placeholder}
				</button>
			</li>
			{#if searching}
				<li class="px-3 py-2 text-sm text-base-content/40">{strings.selectSearching}</li>
			{/if}
			{#each filtered as option (option.value)}
				<li>
					<button
						type="button"
						class="w-full rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
						class:bg-primary={value === option.value}
						class:text-primary-content={value === option.value}
						onclick={() => pick(option)}
					>
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
