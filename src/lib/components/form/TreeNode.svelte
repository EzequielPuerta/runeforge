<script lang="ts">
	import type { SelectOption } from '$lib/types/attribute.js';
	import TreeNode from './TreeNode.svelte';

	let {
		node,
		childrenByParent,
		selected,
		onToggle,
		disabled,
		depth,
		columns,
		defaultExpanded,
		visible = null,
		forceExpanded = null
	}: {
		node: SelectOption;
		childrenByParent: Map<string | null, SelectOption[]>;
		selected: Set<string>;
		onToggle: (value: string, checked: boolean) => void;
		disabled: boolean;
		depth: number;
		columns: number;
		defaultExpanded: boolean;
		// Active search results: node values allowed to render, and the subset
		// that must stay expanded because their match is in a descendant, not
		// on the node itself. Both null outside of a search.
		visible?: Set<string> | null;
		forceExpanded?: Set<string> | null;
	} = $props();

	let expanded = $state(defaultExpanded);

	// A search match below this node overrides manual collapse so the result
	// is reachable; re-derived only when this node's forced state actually
	// flips, so a manual collapse made afterwards (still mid-search) sticks.
	const isForceExpanded = $derived(forceExpanded?.has(node.value) ?? false);
	$effect(() => {
		if (isForceExpanded) expanded = true;
	});

	const allChildren = $derived(childrenByParent.get(node.value) ?? []);
	const children = $derived(
		visible ? allChildren.filter((child) => visible.has(child.value)) : allChildren
	);
	const hasChildren = $derived(children.length > 0);
</script>

<div class="flex flex-col" style={`--columns: ${columns}`}>
	<div
		class="flex w-full items-center gap-1 rounded py-1 pr-2 transition-colors hover:bg-base-200"
		style={`padding-left: ${depth * 1.25}rem`}
	>
		{#if hasChildren}
			<button
				type="button"
				class="btn btn-ghost btn-xs btn-circle"
				aria-label={expanded ? 'Collapse' : 'Expand'}
				onclick={() => (expanded = !expanded)}
			>
				<span class="inline-block text-xs transition-transform" class:rotate-90={expanded}>▸</span>
			</button>
		{:else}
			<span class="inline-block size-6"></span>
		{/if}

		<input
			type="checkbox"
			class="checkbox checkbox-sm"
			checked={selected.has(node.value)}
			{disabled}
			onchange={(e) => onToggle(node.value, (e.currentTarget as HTMLInputElement).checked)}
			aria-label={node.label}
		/>

		<span>{node.label}</span>
	</div>

	{#if expanded && hasChildren}
		{#each children as child (child.value)}
			<TreeNode
				node={child}
				{childrenByParent}
				{selected}
				{onToggle}
				{disabled}
				depth={depth + 1}
				{columns}
				{defaultExpanded}
				{visible}
				{forceExpanded}
			/>
		{/each}
	{/if}
</div>
