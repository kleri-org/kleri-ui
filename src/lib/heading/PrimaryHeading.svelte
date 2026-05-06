<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	interface Props {
		children: any;
		class?: ClassValue | null | undefined;
	}

	let { children, class: className }: Props = $props();
</script>

<h1
	class={cn(
		'pointer-events-none kleri-text-animation cursor-default text-left font-Poppins text-5xl leading-normal font-bold whitespace-nowrap shadow-foreground drop-shadow-2xl select-none',
		className
	)}
>
	{@render children?.()}
</h1>
