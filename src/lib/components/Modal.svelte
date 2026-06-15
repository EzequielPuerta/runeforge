<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '$lib/components/form/Button.svelte';

  let {
    title = '',
    onClose,
    children,
  }: {
    title?: string;
    onClose?: () => void;
    children: Snippet;
  } = $props();
</script>

<dialog class="modal" open>
  <div class="modal-box">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-lg font-bold">{title}</h3>
      {#if onClose}
        <Button
          variant="ghost"
          class="btn-circle"
          aria-label="Cerrar"
          onclick={onClose}
        >
          ✕
        </Button>
      {/if}
    </div>

    <div class="divider my-2"></div>

    {@render children()}
  </div>

  {#if onClose}
    <div class="modal-backdrop">
      <button onclick={onClose} aria-label="Cerrar"></button>
    </div>
  {/if}
</dialog>
