<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { untrack } from 'svelte';
  import { deserialize } from '$app/forms';
  import Field from '$lib/components/crud/Field.svelte';
  import Button from '$lib/components/form/Button.svelte';
  import Header from '$lib/components/common/Header.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import type { ActionConfiguration, FieldDefinition } from '$lib/types/crud.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    labelOne = '',
    labelMany = '',
    icon,
    idKey = '_id',
    fields = [] as FieldDefinition<T>[],
    instance = {} as T,
    read = {} as ActionConfiguration<T>,
    onCancel,
  }: {
    labelOne?: string;
    labelMany?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    idKey?: string;
    fields?: FieldDefinition<T>[];
    instance?: T;
    read?: ActionConfiguration<T>;
    onCancel?: () => void;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);
  const entityIcon = $derived(icon ?? icons.folder);

  let record = $state<Record<string, unknown>>(untrack(() => instance as Record<string, unknown>));

  $effect(() => {
    const endpoint = read.endpoint;
    const id = (instance as Record<string, unknown>)[idKey];
    if (!endpoint || id == null) return;

    let cancelled = false;
    (async () => {
      const fd = new FormData();
      fd.set('id', String(id));
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const result = deserialize(await res.text());
      if (!cancelled && result.type === 'success') {
        const data = result.data as Record<string, unknown> | undefined;
        const fetched = data
          ? Object.values(data).find(
              (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && idKey in (v as object)
            )
          : undefined;
        if (fetched && typeof fetched === 'object') record = fetched as Record<string, unknown>;
      }
    })();
    return () => { cancelled = true; };
  });
</script>

<div class="flex flex-col gap-6">

  <Header
    admin
    title={labelMany}
    breadcrumbs={[
      { label: labelMany, icon: entityIcon, link: { href: '#', onclick: (e) => { e.preventDefault(); onCancel?.(); } }, prominent: true },
      { label: read.label ?? labelOne, icon: icons.view },
    ]}
  />

  <div class="fields-panel mx-auto flex w-full flex-col gap-4 px-4">
    {#each fields as field (field.attribute)}
      <Field {field} {record} readonly />
    {/each}

    <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button variant="ghost" onclick={() => onCancel?.()}>
        {strings.back}
      </Button>
    </div>
  </div>
</div>

<style>
  .fields-panel {
    max-width: var(--runeforge-form-max-width, 32rem);
  }
</style>
