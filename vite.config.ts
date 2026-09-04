import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	// `cally` and `sortablejs` are only ever reached through a dynamic
	// `import()` (Field/ColumnFilter's datetime picker, the reorder table
	// layer's SortableJS wiring), so Vite's dependency crawler doesn't see
	// them ahead of time. Without this, the *first* dev-server request that
	// hits one of those code paths triggers a "new dependency optimized"
	// full-page reload mid-interaction — which is exactly what was making
	// the reorder and datetime-filter e2e specs occasionally flake on a
	// freshly started server.
	optimizeDeps: {
		include: ['cally', 'sortablejs']
	}
});
