<script lang="ts">
  import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
  import { taskMeta as meta } from './interface.js';
  import type { PageData } from './$types';

  let {
    data,
    form
  }: {
    data: PageData;
    form: { error?: string } | null
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
  />
</div>
