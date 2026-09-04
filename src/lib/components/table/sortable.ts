import type { Action } from 'svelte/action';
import type { SortableModule } from '$lib/types/table.js';

/** The indices SortableJS reports a drag settled at — `oldIndex`/`newIndex`
 * for a single-row drag, `oldIndicies`/`newIndicies` (one entry per row)
 * instead when `multiDrag` moved a whole selection together. */
export interface SortEndIndices {
  oldIndex?: number;
  newIndex?: number;
  oldIndicies: number[];
  newIndicies: number[];
}

export interface SortableRowsParams {
  enabled: boolean;
  /** The resolved `sortablejs` module — required whenever `enabled` is true.
   * Runeforge never imports `sortablejs` itself; the caller supplies it. */
  sortable?: SortableModule;
  multiDrag?: boolean;
  onStart?: () => void;
  onEnd?: (indices: SortEndIndices) => void;
}

// A real Tailwind utility (not a hand-rolled class) so it's picked up by the
// consuming project's own Tailwind build — see the README's "Tailwind source
// scanning" note about `@source`-ing this package's `dist` output.
const MULTI_DRAG_SELECTED_CLASS = 'bg-primary/10';

/** Mounts SortableJS on a `<tbody>` to drive drag-to-reorder, restricting
 * drag initiation to elements carrying `data-reorder-handle`. The settled
 * order is computed from SortableJS's own before/after indices (see
 * TableBody) rather than read back from the DOM — `multiDrag` in particular
 * doesn't reliably leave the DOM in the dropped state, only its event data
 * reflects it correctly. */
export const sortableRows: Action<HTMLElement, SortableRowsParams> = (node, params) => {
  let instance: ReturnType<SortableModule['create']> | undefined;

  function setup(p: SortableRowsParams) {
    instance?.destroy();
    instance = undefined;
    if (!p.enabled || !p.sortable) return;

    instance = p.sortable.create(node, {
      handle: '[data-reorder-handle]',
      animation: 150,
      // Mouse/touch-simulated dragging instead of native HTML5 DnD: avoids
      // native drag-ghost/Firefox quirks and (usefully) makes drags
      // reproducible with plain mouse events in end-to-end tests. Not used
      // together with `multiDrag`, though — SortableJS's MultiDrag plugin
      // relies on native HTML5 DnD to track a multi-item drag correctly;
      // paired with `forceFallback` it reports the drop as a no-op.
      forceFallback: !p.multiDrag,
      // Keeps the floating drag clone out of the `<tbody>` — otherwise it's
      // an extra element carrying the same `data-row-key` as the row it was
      // cloned from, which could confuse the multi-drag selection sync query.
      fallbackOnBody: true,
      multiDrag: p.multiDrag || undefined,
      selectedClass: p.multiDrag ? MULTI_DRAG_SELECTED_CLASS : undefined,
      onStart: () => p.onStart?.(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onEnd: (evt: any) => {
        p.onEnd?.({
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          oldIndicies: (evt.oldIndicies ?? []).map((e: any) => e.index),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newIndicies: (evt.newIndicies ?? []).map((e: any) => e.index),
        });
      },
    });
  }

  setup(params);

  return {
    update: setup,
    destroy() {
      instance?.destroy();
    },
  };
};
