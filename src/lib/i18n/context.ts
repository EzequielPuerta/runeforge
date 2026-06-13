import { getContext, setContext } from 'svelte';
import type { RuneforgeStrings } from '$lib/i18n/types.js';
import { es } from '$lib/i18n/es.js';

const KEY = Symbol('runeforge-strings');

export function setStrings(strings: Partial<RuneforgeStrings>): void {
  const existing = getContext<RuneforgeStrings | undefined>(KEY) ?? es;
  setContext(KEY, { ...existing, ...strings });
}

export function getStrings(): RuneforgeStrings {
  return getContext<RuneforgeStrings | undefined>(KEY) ?? es;
}
