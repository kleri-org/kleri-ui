import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import svelteConfig from './svelte.config.js';

export default defineConfig(
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			// SvelteKit navigation rule is overly strict for static showcase pages
			'svelte/no-navigation-without-resolve': 'off',
			// Allow standard Set/Map where SvelteSet isn't necessary
			'svelte/prefer-svelte-reactivity': 'off',
			// Svelte auto-generated .d.ts uses `{}` for Component<Props, {}, ''>
			'@typescript-eslint/no-empty-object-type': ['error', { allowObjectTypes: 'always' }]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		ignores: ['.svelte-kit/', 'dist/', 'build/', '.cloudflare/', 'worker-configuration.d.ts']
	}
);
