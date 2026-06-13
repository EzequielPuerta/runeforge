<script lang="ts">
  import Button from '$lib/components/form/Button.svelte';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    page = $bindable(1),
    totalPages,
    pageStart,
    pageSize,
    total,
  }: {
    page?: number;
    totalPages: number;
    pageStart: number;
    pageSize: number;
    total: number;
  } = $props();

  function prev() {
    if (page > 1) page--;
  }
  function next() {
    if (page < totalPages) page++;
  }
</script>

{#if totalPages > 1}
  <div class="flex items-center justify-between">
    <span class="text-sm text-base-content/60">
      {strings.showing(pageStart + 1, Math.min(pageStart + pageSize, total), total)}
    </span>

    <div class="join">
      <Button
        class="join-item btn-sm"
        disabled={page === 1}
        onclick={prev}
      >
        «
      </Button>

      {#each Array.from({ length: totalPages }, (_, i) => i + 1) as n (n)}
        <Button
          class={['join-item btn-sm', n === page && 'btn-active']}
          onclick={() => (page = n)}
        >
          {n}
        </Button>
      {/each}

      <Button
        class="join-item btn-sm"
        disabled={page === totalPages}
        onclick={next}
      >
        »
      </Button>
    </div>
  </div>
{/if}
