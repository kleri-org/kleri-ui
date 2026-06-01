import { getContext, setContext } from 'svelte';
import type { ToggleVariants } from './toggle-variants.js';

interface ToggleGroupContext extends ToggleVariants {
	orientation?: 'horizontal' | 'vertical';
}

export function setToggleGroupCtx(props: ToggleGroupContext) {
	setContext('kleri-toggle-group', props);
}

export function getToggleGroupCtx() {
	return getContext<Required<ToggleGroupContext>>('kleri-toggle-group');
}
