<script lang="ts">
  import PaginatedTable from '$lib/components/table/PaginatedTable.svelte';
  import type { ColumnDefinition } from '$lib/types/crud.js';

  type Person = { name: string; age: number; city: string };

  const columns: ColumnDefinition<Person>[] = [
    { attribute: 'name', title: 'Name' },
    { attribute: 'age', title: 'Age' },
    { attribute: 'city', title: 'City' },
  ];

  const cities = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán'];
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

  const data: Person[] = Array.from({ length: 25 }, (_, i) => ({
    name: `${firstNames[i % 5]} ${i + 1}`,
    age: 20 + (i % 40),
    city: cities[i % 5],
  }));
</script>

<div class="p-6">
  <PaginatedTable {data} {columns} selectable={false} />
</div>
