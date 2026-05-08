import { getContext, setContext } from 'svelte';

export interface ButtonGroupContext {
	size?: 'sm' | 'lg';
	variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

const BUTTON_GROUP_CONTEXT_KEY = Symbol('kleri-button-group');

export function setButtonGroupContext(context: ButtonGroupContext) {
	setContext(BUTTON_GROUP_CONTEXT_KEY, context);
}

export function getButtonGroupContext(): ButtonGroupContext | undefined {
	return getContext(BUTTON_GROUP_CONTEXT_KEY);
}
