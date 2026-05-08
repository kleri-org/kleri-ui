import type { Component } from 'svelte';

export type ButtonGroupItem =
	| {
			type: 'button';
			label: string;
			icon?: Component;
			tooltip?: string;
			disabled?: boolean;
			class?: string;
			onclick?: (e: MouseEvent) => void;
	  }
	| { type: 'separator' }
	| { type: 'text'; content: string };
