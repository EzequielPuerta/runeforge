<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getStrings } from '$lib/i18n/context.js';
	import type { SearchConfiguration } from '$lib/types/crud.js';

	const strings = getStrings();

	let {
		config = {} as SearchConfiguration
	}: {
		config?: SearchConfiguration;
	} = $props();

	const param = $derived(config.param ?? 'search');
	const debounceMs = $derived(config.debounceMs ?? 300);

	// Intentional one-time hydration of local state from the initial `param`
	// value (not a live binding) - svelte-check's state_referenced_locally
	// warning is a false positive here, same as PaginatedTable's initialSort
	// etc. After mount this is the source of truth for what the user is
	// typing, so it doesn't fight with the URL updates this component itself
	// triggers on every keystroke.
	let value = $state(page.url.searchParams.get(param) ?? '');
	let debounceTimer: ReturnType<typeof setTimeout>;

	function onInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const params = new URLSearchParams(page.url.searchParams);
			const trimmed = value.trim();
			if (trimmed) params.set(param, trimmed);
			else params.delete(param);
			// A new search term can leave the current page past the end of the
			// narrowed result set, and any open create/read/edit view stops
			// making sense once the underlying list changes - drop both.
			params.delete('page');
			params.delete('view');
			params.delete('id');
			const qs = params.toString();
			goto(qs ? `?${qs}` : '?', { keepFocus: true, noScroll: true, replaceState: true });
		}, debounceMs);
	}
</script>

<input
	type="search"
	bind:value
	oninput={onInput}
	placeholder={config.placeholder ?? strings.searchPlaceholder}
	class="input input-bordered w-64 shrink-0"
/>
