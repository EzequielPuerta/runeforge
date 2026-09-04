<script module>
	// Mounted once (module scope, not per-instance) — required for `multiDrag`
	// to take effect. Consumers wanting `multiDrag` do the same on whatever
	// `sortablejs` module they pass into `config.reorder.sortable`.
	import Sortable, { MultiDrag } from 'sortablejs';
	Sortable.mount(new MultiDrag());
</script>

<script lang="ts">
	import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
	import { indicatorMeta as meta } from './interface.js';
	import type { IIndicator } from './interface.js';
	import type { PageData } from './$types.js';

	let {
		data,
		form
	}: {
		data: PageData;
		form: { error?: string } | null;
	} = $props();
</script>

<div class="p-6">
	<GenericCRUD
		labelOne="Indicator"
		labelMany="Indicators"
		data={{ indicators: data.indicators }}
		{form}
		{meta}
		dataKey="indicators"
		deletion={{ endpoint: '?/delete' }}
		config={{
			reorder: {
				attribute: 'order',
				sortable: Sortable,
				// Composite order: the related "chapter" (`group`) first, then
				// this indicator's own (chapter-scoped) `order`.
				compare: (a: IIndicator, b: IIndicator) => a.group - b.group || a.order - b.order,
				endpoint: '?/reorder',
				multiDrag: true,
				pageFlipThresholdMs: 300
			}
		}}
	/>
</div>
