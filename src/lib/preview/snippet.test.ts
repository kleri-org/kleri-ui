import { describe, expect, it } from 'vitest';
import { formatSnippet, toJs } from './snippet.js';

describe('toJs', () => {
	it('prints nested values as valid JS literals', () => {
		const Sun = () => {};
		const code = toJs(
			[{ value: 'light', label: "Today's", icon: Sun, 'data-x': 1, gone: undefined }],
			new Map([[Sun, 'Sun']])
		);

		expect(code).toBe(
			"[\n  {\n    value: 'light',\n    label: 'Today\\'s',\n    icon: Sun,\n    'data-x': 1\n  }\n]"
		);
		// The nested output parses as a JS expression.
		expect(() => new Function(`const Sun = 1; return ${code};`)).not.toThrow();
	});
});

describe('formatSnippet', () => {
	it('starts with an import line and leaves defaults out', () => {
		const code = formatSnippet({
			component: 'KleriInput',
			props: { label: 'Matter name', withBorder: true, disabled: false },
			defaults: { withBorder: true, disabled: false }
		});

		expect(code).toBe(
			'<script lang="ts">\n  import { KleriInput } from \'@kleri/ui\';\n</script>\n\n<KleriInput\n  label="Matter name"\n/>'
		);
	});

	it('writes bound props as bind: with a $state declaration', () => {
		const code = formatSnippet({
			component: 'KleriSlider',
			props: { value: 40, max: 100 },
			bindings: ['value']
		});

		expect(code).toContain('let value = $state(40);');
		expect(code).toContain('  bind:value\n');
		expect(code).not.toContain('value={40}');
	});

	it('prints symbols as bare identifiers and adds their imports', () => {
		const Gavel = () => {};
		const code = formatSnippet({
			component: 'KleriInput',
			props: { InputIcon: Gavel },
			symbols: new Map([[Gavel, 'Gavel']]),
			imports: ["import { Gavel } from '@lucide/svelte';"]
		});

		expect(code).toContain("import { Gavel } from '@lucide/svelte';");
		expect(code).toContain('InputIcon={Gavel}');
	});

	it('renders string children between the tags', () => {
		const code = formatSnippet({ component: 'KleriButton', props: { children: 'Save' } });

		expect(code.endsWith('<KleriButton>\n  Save\n</KleriButton>')).toBe(true);
	});
});
