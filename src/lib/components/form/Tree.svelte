<script lang="ts">
	import type { SelectOption } from '$lib/types/attribute.js';
	import { buildChildrenByParent, collectDescendantIds } from '$lib/components/crud/utils/tree.js';
	import TreeNode from './TreeNode.svelte';

	let {
		name,
		value = $bindable([]),
		options = [],
		disabled = false,
		columns = 1,
	}: {
		name?: string;
		value?: string[];
		options?: SelectOption[];
		disabled?: boolean;
		columns?: number;
	} = $props();

	const childrenByParent = $derived(buildChildrenByParent(options));
	const selected = $derived(new Set(value));
	const roots = $derived(childrenByParent.get(null) ?? []);

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

<div
	class="rounded-box border border-base-300 p-2"
	class:opacity-50={disabled}
	class:pointer-events-none={disabled}
>
	{#if name}
		<input type="hidden" {name} value={JSON.stringify(value)} />
	{/if}
	{#if roots.length === 0}
		<p class="px-1 py-2 text-sm text-base-content/40">—</p>
	{/if}
	<div class:leaf-columns={columns > 1} style={`--columns: ${columns}`}>
		{#each roots as root (root.value)}
			<TreeNode node={root} {childrenByParent} {selected} onToggle={toggle} {disabled} depth={0} {columns} />
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
