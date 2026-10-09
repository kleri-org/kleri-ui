/**
 * Builds the usage snippet `CodePreview` shows: an import line, a `$state`
 * declaration per bound prop, and the component tag with one prop per line.
 * Kept free of Svelte so it can be unit-tested in node.
 */

export type SnippetOptions = {
	component: string;
	props: Record<string, unknown>;
	/** Values printed as bare identifiers (icons, components). */
	symbols?: Map<unknown, string>;
	/** Props equal to their default here are left out. */
	defaults?: Record<string, unknown>;
	/** Props written as `bind:name`, backed by a `$state` declaration. */
	bindings?: string[];
	/** @default '@kleri/ui' */
	from?: string;
	/** Other names imported from `from` alongside the component. */
	importNames?: string[];
	/** Extra import lines, printed after the component's. */
	imports?: string[];
};

const INDENT = '  ';
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** A value as a valid JS expression, indented for its depth. */
export function toJs(value: unknown, symbols?: Map<unknown, string>, depth = 0): string {
	const symbol = symbols?.get(value);
	if (symbol) return symbol;
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (typeof value === 'function') return '() => {}';

	const pad = INDENT.repeat(depth + 1);
	const close = INDENT.repeat(depth);
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		// Short lists of plain values read best on one line: ['image', 'pdf'].
		const inline = `[${value.map((item) => toJs(item, symbols)).join(', ')}]`;
		if (value.every((item) => item === null || typeof item !== 'object') && inline.length <= 60) {
			return inline;
		}
		const items = value.map((item) => `${pad}${toJs(item, symbols, depth + 1)}`);
		return `[\n${items.join(',\n')}\n${close}]`;
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return '{}';
		const lines = entries.map(([key, v]) => {
			const name = IDENTIFIER.test(key) ? key : `'${key}'`;
			return `${pad}${name}: ${toJs(v, symbols, depth + 1)}`;
		});
		return `{\n${lines.join(',\n')}\n${close}}`;
	}
	return String(value);
}

/** One prop as a Svelte attribute. Plain strings stay quoted; everything else is `{expr}`. */
function toAttribute(key: string, value: unknown, symbols?: Map<unknown, string>): string {
	if (typeof value === 'string' && !symbols?.has(value) && !/["{}]/.test(value)) {
		return `${key}="${value}"`;
	}
	return `${key}={${toJs(value, symbols, 1)}}`;
}

function isEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every((key) =>
		isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
	);
}

export function formatSnippet({
	component,
	props,
	symbols,
	defaults,
	bindings = [],
	from = '@kleri/ui',
	importNames = [],
	imports = []
}: SnippetOptions): string {
	const { children, ...rest } = props;
	const bound = new Set(bindings);

	const script = [
		`import { ${[component, ...importNames].join(', ')} } from '${from}';`,
		...imports
	];
	const state = bindings
		.filter((key) => key in rest)
		.map((key) => `let ${key} = $state(${toJs(rest[key], symbols, 1)});`);
	if (state.length > 0) script.push('', ...state);

	const attributes = Object.entries(rest)
		.filter(([key, value]) => {
			if (bound.has(key)) return true;
			if (value === undefined) return false;
			return !(defaults && key in defaults && isEqual(value, defaults[key]));
		})
		.map(([key, value]) => (bound.has(key) ? `bind:${key}` : toAttribute(key, value, symbols)));

	const header = `<script lang="ts">\n${script.map((line) => (line ? INDENT + line : '')).join('\n')}\n</script>\n\n`;
	const open =
		attributes.length > 0
			? `<${component}\n${attributes.map((a) => INDENT + a).join('\n')}\n`
			: `<${component}`;

	if (typeof children === 'string' && children !== '') {
		const body = children
			.split('\n')
			.map((line) => INDENT + line)
			.join('\n');
		return `${header}${open}>\n${body}\n</${component}>`;
	}
	return `${header}${open}${attributes.length > 0 ? '' : ' '}/>`;
}
