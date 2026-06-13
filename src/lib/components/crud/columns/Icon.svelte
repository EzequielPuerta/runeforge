<script lang="ts">
  import IconRenderer from '$lib/components/IconRenderer.svelte';
  import type { CellProps } from '$lib/types/table.js';

  let { value }: CellProps<Record<string, unknown>, string> = $props();
</script>

<IconRenderer name={String(value ?? '')} />
