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
