<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	interface Props {
		children: import('svelte').Snippet;
		class?: ClassValue | null | undefined;
	}

	let { children, class: className }: Props = $props();
</script>

<h1
	class={cn(
		'pointer-events-none kleri-text-animation cursor-default text-left font-Poppins text-[length:clamp(2rem,1rem+5vw,3rem)] leading-normal font-bold text-balance wrap-break-word shadow-foreground drop-shadow-2xl select-none',
		className
	)}
>
	{@render children?.()}
</h1>
