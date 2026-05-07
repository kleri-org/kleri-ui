<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: ClassValue | null | undefined;
	}

	let { children, class: className }: Props = $props();
</script>

<h1
	class={cn(
		'pointer-events-none cursor-default pb-5 text-left font-spacemono text-4xl leading-normal font-bold whitespace-nowrap text-primary shadow-kleri-green-2 drop-shadow select-none',
		className
	)}
>
	{@render children?.()}
</h1>
