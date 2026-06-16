import { getContext, setContext } from 'svelte';

export interface RuneforgeConfig {
  homeHref?: string;
}

const KEY = Symbol('runeforge-config');

export function setConfig(config: RuneforgeConfig): void {
  const existing = getContext<RuneforgeConfig | undefined>(KEY) ?? {};
  setContext(KEY, { ...existing, ...config });
}

export function getConfig(): RuneforgeConfig {
  return getContext<RuneforgeConfig | undefined>(KEY) ?? {};
}
