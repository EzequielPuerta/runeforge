<script lang="ts">
  import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
  import { personMeta as meta } from './interface.js';
  import type { PageData } from './$types.js';

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
    labelOne="Person"
    labelMany="People"
    data={{ people: data.people }}
    {form}
    {meta}
    dataKey="people"
    idKey="id"
    creation={{ enabled: false }}
    update={{ enabled: false }}
    read={{ enabled: false }}
    deletion={{ endpoint: '?/delete' }}
  />
</div>
