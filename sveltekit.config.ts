import adapter from '@sveltejs/adapter-cloudflare';
import type { Config } from '@sveltejs/kit/vite';

const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	adapter: adapter({
		routes: {
			include: ['/*'],
			exclude: ['<all>']
		}
	})
} satisfies Config;

export default config;
