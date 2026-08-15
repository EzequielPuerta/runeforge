import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			// False positive on $bindable props: a default value assigned in the
			// destructuring, then reassigned by an $effect to publish a computed
			// value outward, reads as "useless" to this rule — it doesn't know
			// the prop is read externally by the parent through the binding.
			'no-useless-assignment': 'off',
			// goto() calls here only ever update the current page's query string
			// (e.g. `?view=create`), never navigate to a different route — and as
			// a library, this package doesn't know its consuming app's route ID
			// to build a typed `resolve()` target for anyway. Leave pushState/
			// replaceState/link checks on, since those would be genuine navigation.
			'svelte/no-navigation-without-resolve': ['error', { ignoreGoto: true }]
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
