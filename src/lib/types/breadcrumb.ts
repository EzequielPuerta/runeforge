import type { HTMLAnchorAttributes } from 'svelte/elements';

export type BreadcrumbItem = {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  link?: HTMLAnchorAttributes;
  prominent?: boolean;
};
