import { getContext, setContext } from 'svelte';
import type { CRUDIconSet } from '$lib/icons/types.js';

const KEY = Symbol('runeforge-icons');

export function setIconSet(icons: Partial<CRUDIconSet>): void {
  const existing = getContext<CRUDIconSet | undefined>(KEY);
  setContext(KEY, { ...existing, ...icons });
}

export function getIconSet(): CRUDIconSet | undefined {
  return getContext<CRUDIconSet | undefined>(KEY);
}
