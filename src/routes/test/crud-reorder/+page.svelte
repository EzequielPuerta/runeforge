<script lang="ts">
	import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
	import Sortable from 'sortablejs';
	import { chapterMeta as meta } from './interface.js';
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
		labelOne="Chapter"
		labelMany="Chapters"
		data={{ chapters: data.chapters }}
		{form}
		{meta}
		dataKey="chapters"
		deletion={{ endpoint: '?/delete' }}
		config={{
			reorder: { attribute: 'order', sortable: Sortable, endpoint: '?/reorder' }
		}}
	/>
</div>
