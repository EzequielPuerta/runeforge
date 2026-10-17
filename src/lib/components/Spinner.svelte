<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getStrings } from '$lib/i18n/context.js';

  type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Literal class names (not `loading-${size}`) so Tailwind's source scan picks them up.
  const sizeClasses: Record<SpinnerSize, string> = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
    xl: 'loading-xl',
  };

  const strings = getStrings();

  let {
    size = 'xl',
    label,
    class: additionalClass,
    ...rest
  }: {
    size?: SpinnerSize;
    /** Accessible label announced to screen readers. Defaults to `strings.loading`. */
    label?: string;
  } & HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span
  class={['loading loading-spinner', sizeClasses[size], additionalClass]}
  role="status"
  aria-label={label ?? strings.loading}
  {...rest}
></span>
