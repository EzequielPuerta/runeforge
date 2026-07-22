<script lang="ts">
	import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
	import { widgetMeta as meta } from './interface.js';
	import type { PageData } from './$types';

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
		labelOne="Widget"
		labelMany="Widgets"
		data={{ widgets: data.widgets }}
		{form}
		{meta}
		dataKey="widgets"
		deletion={{ endpoint: '?/delete' }}
	/>
</div>
