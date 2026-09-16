import type { SelectOption } from '$lib/types/attribute.js';

// Shared by the `tree` field type (Tree.svelte) and its readonly rendering:
// groups a flat SelectOption[] by `parentValue`, so the tree can be walked
// without re-scanning the full list at every node.
export function buildChildrenByParent(options: SelectOption[]): Map<string | null, SelectOption[]> {
	const map = new Map<string | null, SelectOption[]>();
	for (const option of options) {
		const key = option.parentValue ?? null;
		const list = map.get(key) ?? [];
		list.push(option);
		map.set(key, list);
	}
	return map;
}

// Shared by Tree.svelte: when a node is checked/unchecked, every descendant
// follows the same selection state (cascading select), matching how the
// original per-app CategoryTree component behaved.
export function collectDescendantIds(
	value: string,
	childrenByParent: Map<string | null, SelectOption[]>
): string[] {
	const ids: string[] = [];
	function visit(parentValue: string): void {
		for (const child of childrenByParent.get(parentValue) ?? []) {
			ids.push(child.value);
			visit(child.value);
		}
	}
	visit(value);
	return ids;
}

export interface TreeSearchState {
	// Nodes to render: the query's own matches plus every ancestor needed to
	// reach them, so the tree structure around a hit stays intact.
	visible: Set<string>;
	// Subset of `visible` that must be force-expanded because the match lives
	// in its subtree rather than on the node itself.
	forceExpanded: Set<string>;
}

// Shared by Tree.svelte: narrows the tree to whatever matches the typed
// query, by label, case-insensitively. Returns null for a blank query so
// callers can tell "no filter" apart from "filter matched nothing".
export function buildTreeSearchState(
	query: string,
	childrenByParent: Map<string | null, SelectOption[]>
): TreeSearchState | null {
	const needle = query.trim().toLowerCase();
	if (!needle) return null;

	const visible = new Set<string>();
	const forceExpanded = new Set<string>();

	function visit(node: SelectOption): boolean {
		let hasMatchingDescendant = false;
		for (const child of childrenByParent.get(node.value) ?? []) {
			if (visit(child)) hasMatchingDescendant = true;
		}
		const selfMatches = node.label.toLowerCase().includes(needle);
		if (selfMatches || hasMatchingDescendant) {
			visible.add(node.value);
			if (hasMatchingDescendant) forceExpanded.add(node.value);
			return true;
		}
		return false;
	}

	for (const root of childrenByParent.get(null) ?? []) {
		visit(root);
	}

	return { visible, forceExpanded };
}
