import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
		},
	},
	test: {
		include: ['tests/unit/**/*.test.ts'],
		environment: 'node',
	},
});
