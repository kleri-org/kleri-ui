import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

import html from '@shikijs/langs/html';
import javascript from '@shikijs/langs/javascript';
import tsx from '@shikijs/langs/tsx';

// Custom Kleri theme - uses CSS variables for integration with kleri-ui.css
// Light theme colors (default)
const kleriLight = {
	name: 'kleri-light',
	type: 'light' as const,
	colors: {
		'editor.background': 'var(--color-kleri-code-bg)',
		'editor.foreground': 'var(--color-kleri-code-foreground)'
	},
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: {
				foreground: 'var(--color-kleri-code-comment)',
				fontStyle: 'italic'
			}
		},
		{
			scope: ['string', 'string.quoted', 'string.template'],
			settings: {
				foreground: 'var(--color-kleri-code-string)'
			}
		},
		{
			scope: ['keyword', 'storage.type', 'storage.modifier'],
			settings: {
				foreground: 'var(--color-kleri-code-keyword)'
			}
		},
		{
			scope: ['constant.numeric', 'constant.language'],
			settings: {
				foreground: 'var(--color-kleri-code-number)'
			}
		},
		{
			scope: ['constant.boolean', 'constant.language.boolean'],
			settings: {
				foreground: 'var(--color-kleri-code-boolean)'
			}
		},
		{
			scope: ['entity.name.tag', 'entity.name.tag.html', 'entity.name.tag.jsx'],
			settings: {
				foreground: 'var(--color-kleri-code-tag)'
			}
		},
		{
			scope: ['entity.name.function', 'support.function'],
			settings: {
				foreground: 'var(--color-kleri-code-function)'
			}
		},
		{
			scope: ['variable', 'variable.other', 'variable.name'],
			settings: {
				foreground: 'var(--color-kleri-code-variable)'
			}
		},
		{
			scope: [
				'entity.other.attribute-name',
				'entity.other.attribute-name.html',
				'entity.other.attribute-name.jsx'
			],
			settings: {
				foreground: 'var(--color-kleri-code-attribute)'
			}
		},
		{
			scope: ['punctuation', 'meta.brace', 'meta.delimiter'],
			settings: {
				foreground: 'var(--color-kleri-code-punctuation)'
			}
		},
		{
			scope: ['invalid', 'invalid.illegal'],
			settings: {
				foreground: 'var(--color-kleri-code-error)'
			}
		}
	]
};

// Dark theme variant - same structure, CSS variables will resolve differently
const kleriDark = {
	name: 'kleri-dark',
	type: 'dark' as const,
	colors: {
		'editor.background': 'var(--color-kleri-code-bg)',
		'editor.foreground': 'var(--color-kleri-code-foreground)'
	},
	tokenColors: kleriLight.tokenColors
};

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

const highlighterSingleton = createHighlighterCore({
	themes: [kleriLight, kleriDark],
	langs: [html, javascript, tsx],
	engine: jsEngine
});

export async function getHighlighter() {
	return await highlighterSingleton;
}
