<script lang="ts">
	import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
	import { appointmentMeta as meta } from './interface.js';
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
		labelOne="Appointment"
		labelMany="Appointments"
		data={{ appointments: data.appointments, appointment: data.appointment }}
		{form}
		{meta}
		dataKey="appointments"
		idKey="id"
		creation={{ endpoint: '?/create' }}
		update={{ endpoint: '?/update' }}
		deletion={{ enabled: false }}
	/>
</div>
