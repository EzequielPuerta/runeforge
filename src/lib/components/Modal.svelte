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

<div class="modal modal-open" role="dialog" aria-modal="true">
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
    <div
      class="modal-backdrop"
      aria-label="Cerrar"
      role="button"
      tabindex="0"
      onclick={onClose}
      onkeydown={(e) => e.key === 'Enter' && onClose?.()}
    ></div>
  {/if}
</div>
