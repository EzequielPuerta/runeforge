<script lang="ts">
  import PaginatedTable from '$lib/components/table/PaginatedTable.svelte';
  import type { ColumnDefinition } from '$lib/types/crud.js';

  type Event = { name: string; joined: string };

  const columns: ColumnDefinition<Event>[] = [
    { attribute: 'name', title: 'Name' },
    { attribute: 'joined', title: 'Joined', type: 'datetime' },
  ];

  const today = new Date();

  const data: Event[] = Array.from({ length: 25 }, (_, i) => ({
    name: `Row ${i + 1}`,
    joined: new Date(today.getFullYear(), today.getMonth(), i + 1).toISOString(),
  }));
</script>

<div class="p-6">
  <PaginatedTable {data} {columns} selectable={false} />
</div>
