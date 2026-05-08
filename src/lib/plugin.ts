import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const baseDir = path.dirname(__filename);

const VIRTUAL_MODULE = 'virtual:kleri-ui/base.css';
const RESOLVED_VIRTUAL = '\0' + VIRTUAL_MODULE;

export interface KleriUIOptions {
	/** Automatically include daisyUI plugin. Default: true */
	daisyui?: boolean;
}

/**
 * Vite plugin for zero-config @kleri/ui setup.
 *
 * Add this plugin **once** to your `vite.config.ts`:
 *
 * ```ts
 * import { sveltekit } from '@sveltejs/kit/vite';
 * import { defineConfig } from 'vite';
 * import kleriUI from '@kleri/ui/plugin';
 *
 * export default defineConfig({
 *   plugins: [kleriUI(), sveltekit()]
 * });
 * ```
 *
 * The plugin will:
 * - Warn if `@tailwindcss/vite` is missing
 * - Inject all required CSS (Tailwind, fonts, theme, utilities)
 * - Register the package source for Tailwind class scanning
 * - Optionally enable daisyUI
 */
export default function kleriUI(options: KleriUIOptions = {}) {
	const { daisyui = true } = options;

	return {
		name: 'kleri-ui',

		config(config: any) {
			const plugins = config.plugins || [];
			const hasTailwind = plugins.some((p: any) => {
				if (!p) return false;
				const name = typeof p === 'function' ? p().name : p.name;
				return name?.includes('tailwindcss');
			});

			if (!hasTailwind) {
				console.warn(
					'[@kleri/ui] @tailwindcss/vite plugin not detected.\n' +
						'Please install it and add it to your vite.config.ts:\n\n' +
						"  import tailwindcss from '@tailwindcss/vite';\n" +
						'  plugins: [tailwindcss(), kleriUI(), sveltekit()]\n'
				);
			}
		},

		resolveId(id: string) {
			if (id === VIRTUAL_MODULE) return RESOLVED_VIRTUAL;
		},

		load(id: string) {
			if (id === RESOLVED_VIRTUAL) {
				const lines = [
					`@import 'tailwindcss';`,
					`@source '${baseDir}';`,
					`@import '${path.join(baseDir, 'styles/fonts.css').replace(/\\/g, '/')}';`,
					`@import '${path.join(baseDir, 'styles/kleri-theme.css').replace(/\\/g, '/')}';`
				];
				if (daisyui) {
					lines.push(`@plugin 'daisyui';`);
				}
				return lines.join('\n');
			}
		},

		transformIndexHtml(html: string) {
			if (html.includes(VIRTUAL_MODULE)) return;
			return html.replace(
				'</head>',
				`  <script type="module">import '${VIRTUAL_MODULE}';</script>\n</head>`
			);
		}
	};
}
