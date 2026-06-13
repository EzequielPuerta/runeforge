<script lang="ts">
  let {
    src = null,
    text = '',
    alt = '',
    class: className = 'w-10 rounded-full',
    textClass = '',
  }: {
    src?: string | null;
    text?: string;
    alt?: string;
    class?: string;
    textClass?: string;
  } = $props();

  const placeholder = $derived(text.trim().slice(0, 2).toUpperCase() || '?');
</script>

{#if src}
  <div class="avatar">
    <div class={className}>
      <img {src} {alt} />
    </div>
  </div>
{:else}
  <div class="avatar avatar-placeholder">
    <div class="bg-neutral text-neutral-content {className}">
      <span class={textClass}>{placeholder}</span>
    </div>
  </div>
{/if}
