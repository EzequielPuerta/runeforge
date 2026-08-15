<script lang="ts">
	import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
	import Edit from '$lib/icons/defaults/Edit.svelte';
	import View from '$lib/icons/defaults/View.svelte';
	import { taskMeta as meta } from './interface.js';
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
		labelOne="Task"
		labelMany="Tasks"
		data={{ tasks: data.tasks }}
		{form}
		{meta}
		dataKey="tasks"
		deletion={{ endpoint: '?/delete' }}
		search={{ placeholder: 'Search tasks...' }}
		enableExport
		customBulkActions={[
			{ label: 'Complete', icon: View, endpoint: '?/complete' },
			{ label: 'Mark pending', icon: Edit, endpoint: '?/incomplete' }
		]}
	/>
</div>
