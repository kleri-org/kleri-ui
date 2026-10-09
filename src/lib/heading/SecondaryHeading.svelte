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
		'pointer-events-none cursor-default pb-5 text-left font-spacemono text-[length:clamp(1.5rem,0.9rem+3vw,2.25rem)] leading-normal font-bold text-balance wrap-break-word text-primary shadow-kleri-2 drop-shadow select-none',
		className
	)}
>
	{@render children?.()}
</h1>
