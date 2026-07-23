<script lang="ts">
	import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
	import View from '$lib/icons/defaults/View.svelte';
	import { widgetMeta as meta } from './interface.js';
	import type { IWidget } from './interface.js';
	import type { PageData } from './$types';

	let {
		data,
		form
	}: {
		data: PageData;
		form: { error?: string } | null;
	} = $props();

	const findInTasksAction = {
		label: 'Find in tasks',
		icon: View,
		href: (item: IWidget) => `/test/crud?search=${encodeURIComponent(item.name)}`
	};
</script>

<div class="p-6">
	<GenericCRUD
		labelOne="Widget"
		labelMany="Widgets"
		data={{ widgets: data.widgets, owners: data.owners }}
		{form}
		{meta}
		dataKey="widgets"
		deletion={{ endpoint: '?/delete' }}
		actions={[findInTasksAction]}
	/>
</div>
