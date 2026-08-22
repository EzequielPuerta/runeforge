<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '$lib/components/form/Button.svelte';

  let {
    title = '',
    onClose,
    closeOnClickOutside = true,
    onClickOutside,
    children,
    class: additionalClass,
    width,
    maxWidth,
    height,
    maxHeight,
  }: {
    title?: string;
    onClose?: () => void;
    /** Whether clicking the backdrop (outside the modal box) closes the modal. */
    closeOnClickOutside?: boolean;
    /** Callback invoked when clicking outside the modal. Defaults to `onClose`. */
    onClickOutside?: () => void;
    children: Snippet;
    /** Extra classes merged onto the modal box, e.g. Tailwind size utilities
     * like `max-w-4xl` or `w-11/12`. */
    class?: string;
    /** Explicit size overrides (any valid CSS length, e.g. '600px', '90vw').
     * Applied as inline styles, so they take priority over `class` utilities. */
    width?: string;
    maxWidth?: string;
    height?: string;
    maxHeight?: string;
  } = $props();

  const handleClickOutside = $derived(onClickOutside ?? onClose);

  const boxStyle = $derived(
    [
      width ? `width:${width}` : '',
      maxWidth ? `max-width:${maxWidth}` : '',
      height ? `height:${height}` : '',
      maxHeight ? `max-height:${maxHeight}` : '',
    ]
      .filter(Boolean)
      .join(';')
  );
</script>

<dialog class="modal" open>
  <div class={['modal-box', additionalClass]} style={boxStyle}>
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

  {#if closeOnClickOutside && handleClickOutside}
    <div class="modal-backdrop">
      <button onclick={handleClickOutside} aria-label="Cerrar"></button>
    </div>
  {/if}
</dialog>
