import { getContext, setContext } from 'svelte';
import type { CRUDIconSet } from '$lib/icons/types.js';

const KEY = Symbol('runeforge-icons');
const ASSETS_KEY = Symbol('runeforge-icon-assets-path');

export function setIconSet(icons: Partial<CRUDIconSet>): void {
  const existing = getContext<CRUDIconSet | undefined>(KEY);
  setContext(KEY, { ...existing, ...icons });
}

export function getIconSet(): CRUDIconSet | undefined {
  return getContext<CRUDIconSet | undefined>(KEY);
}

/** Base path `IconRenderer`/`IconCell` fetch named SVG files from, e.g.
 * `setIconAssetsPath('/icons/chapters')` for files served out of
 * `static/icons/chapters/*.svg`. Defaults to `/icons`. */
export function setIconAssetsPath(path: string): void {
  setContext(ASSETS_KEY, path);
}

export function getIconAssetsPath(): string {
  return getContext<string | undefined>(ASSETS_KEY) ?? '/icons';
}
