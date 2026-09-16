<script lang="ts">
	import type { SelectOption } from '$lib/types/attribute.js';
	import {
		buildChildrenByParent,
		buildTreeSearchState,
		collectDescendantIds
	} from '$lib/components/crud/utils/tree.js';
	import { getStrings } from '$lib/i18n/context.js';
	import TreeNode from './TreeNode.svelte';

	const strings = getStrings();

	let {
		name,
		value = $bindable([]),
		options = [],
		disabled = false,
		columns = 1,
		defaultExpanded = true,
		searchable = true
	}: {
		name?: string;
		value?: string[];
		options?: SelectOption[];
		disabled?: boolean;
		columns?: number;
		defaultExpanded?: boolean;
		searchable?: boolean;
	} = $props();

	let query = $state('');

	const childrenByParent = $derived(buildChildrenByParent(options));
	const selected = $derived(new Set(value));
	const searchState = $derived(buildTreeSearchState(query, childrenByParent));
	const allRoots = $derived(childrenByParent.get(null) ?? []);
	const roots = $derived(
		searchState ? allRoots.filter((root) => searchState.visible.has(root.value)) : allRoots
	);

	function toggle(nodeValue: string, checked: boolean) {
		const affected = [nodeValue, ...collectDescendantIds(nodeValue, childrenByParent)];
		if (checked) {
			value = [...new Set([...value, ...affected])];
		} else {
			const affectedSet = new Set(affected);
			value = value.filter((v) => !affectedSet.has(v));
		}
	}
</script>

{#if searchable && options.length > 0}
	<input
		type="search"
		class="input input-bordered input-sm mb-2 w-full"
		placeholder={strings.searchPlaceholder}
		bind:value={query}
		{disabled}
		aria-label={strings.searchPlaceholder}
	/>
{/if}

<div
	class="overflow-y-auto rounded-box border border-base-300 p-2"
	style="height: var(--runeforge-tree-max-height, 24rem)"
	class:opacity-50={disabled}
	class:pointer-events-none={disabled}
>
	{#if name}
		<input type="hidden" {name} value={JSON.stringify(value)} />
	{/if}
	{#if roots.length === 0}
		<p class="px-1 py-2 text-sm text-base-content/40">
			{searchState ? strings.selectNoResults : '—'}
		</p>
	{/if}
	<div class:leaf-columns={columns > 1} style={`--columns: ${columns}`}>
		{#each roots as root (root.value)}
			<TreeNode
				node={root}
				{childrenByParent}
				{selected}
				onToggle={toggle}
				{disabled}
				depth={0}
				{columns}
				{defaultExpanded}
				visible={searchState?.visible ?? null}
				forceExpanded={searchState?.forceExpanded ?? null}
			/>
		{/each}
	</div>
</div>

<style>
	@media (min-width: 1024px) {
		.leaf-columns {
			columns: var(--columns);
		}
	}
</style>
