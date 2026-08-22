<script lang="ts">
	import Button from '$lib/components/form/Button.svelte';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	let {
		page = $bindable(1),
		totalPages,
		pageStart,
		pageSize,
		total
	}: {
		page?: number;
		totalPages: number;
		pageStart: number;
		pageSize: number;
		total: number;
	} = $props();

	function prev() {
		if (page > 1) page--;
	}
	function next() {
		if (page < totalPages) page++;
	}

	function buildPages(current: number, total: number): number[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

		// Local, immediately-discarded dedup set for this one calculation, not
		// reactive state — a plain Set is correct here.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const visible = new Set<number>();
		visible.add(1);
		visible.add(total);
		for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
			visible.add(i);
		}

		const sorted = Array.from(visible).sort((a, b) => a - b);
		const result: number[] = [];
		for (let i = 0; i < sorted.length; i++) {
			if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(0);
			result.push(sorted[i]);
		}
		return result;
	}

	const pages = $derived(buildPages(page, totalPages));
	const inputWidth = $derived(`${String(totalPages).length + 2}ch`);

	function handlePageInput(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		const val = parseInt((e.currentTarget as HTMLInputElement).value);
		if (!isNaN(val) && val >= 1 && val <= totalPages) {
			page = val;
		} else {
			(e.currentTarget as HTMLInputElement).value = String(page);
		}
	}

	function resetInput(e: FocusEvent) {
		(e.currentTarget as HTMLInputElement).value = String(page);
	}
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-between">
		<span class="text-sm text-base-content/60">
			{strings.showing(pageStart + 1, Math.min(pageStart + pageSize, total), total)}
		</span>

		<div class="join">
			<Button class="join-item btn-sm" disabled={page === 1} onclick={prev}>«</Button>

			{#each pages as p, i (i)}
				{#if p === 0}
					<Button class="join-item btn-sm" disabled>…</Button>
				{:else if p === page}
					<input
						type="number"
						class="join-item btn btn-sm no-spinner text-center"
						style="background-color: var(--color-base-100); width: {inputWidth};"
						min="1"
						max={totalPages}
						value={page}
						onkeydown={handlePageInput}
						onblur={resetInput}
					/>
				{:else}
					<Button class="join-item btn-sm" onclick={() => (page = p)}>{p}</Button>
				{/if}
			{/each}

			<Button class="join-item btn-sm" disabled={page === totalPages} onclick={next}>»</Button>
		</div>
	</div>
{/if}

<style>
	.no-spinner {
		appearance: none;
		-moz-appearance: textfield;
	}

	.no-spinner::-webkit-outer-spin-button,
	.no-spinner::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>

