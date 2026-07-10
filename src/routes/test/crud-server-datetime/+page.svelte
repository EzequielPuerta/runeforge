<script lang="ts">
  import GenericCRUD from '$lib/components/crud/GenericCRUD.svelte';
  import { eventMeta as meta } from './interface.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <GenericCRUD
    labelOne="Event"
    labelMany="Events"
    data={{ events: data.events }}
    {meta}
    dataKey="events"
    idKey="id"
    creation={{ enabled: false }}
    update={{ enabled: false }}
    read={{ enabled: false }}
    deletion={{ enabled: false }}
  />
</div>
