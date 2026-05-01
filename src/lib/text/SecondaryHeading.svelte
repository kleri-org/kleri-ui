<script lang="ts">
	import type { ClassValue } from "clsx";
	import { cn } from "$lib/utils";
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
		class?: ClassValue | null | undefined;
	}

	let { children, class: className }: Props = $props();
</script>

<h1
	class={cn(
		"pointer-events-none select-none text-primary font-spacemono text-4xl font-bold leading-normal text-left whitespace-nowrap shadow-kleri-green-2 drop-shadow cursor-default pb-5",
		className
	)}
>
	{@render children?.()}
</h1>
