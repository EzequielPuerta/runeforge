<script lang="ts">
  import AvatarComponent from '$lib/components/Avatar.svelte';
  import { initials } from '$lib/components/crud/utils/misc.js';
  import type { CellProps } from '$lib/types/table.js';

  type AvatarRow = { firstName?: string; lastName?: string; email?: string };

  let { value, row }: CellProps<AvatarRow, string | null | undefined> = $props();
</script>

<AvatarComponent
  src={value ?? null}
  text={initials(row.firstName, row.lastName)}
  alt={row.email ?? ''}
/>
