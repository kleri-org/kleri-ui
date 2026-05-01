<script lang="ts">
	import type { ClassValue } from "clsx";
	import { cn } from "$lib/utils";

	interface Props {
		children: any;
		class?: ClassValue | null | undefined;
	}

	let { children, class: className }: Props = $props();
</script>

<h1
	class={cn(
		"pointer-events-none select-none kleri-text-animation font-Poppins text-5xl font-bold leading-normal text-left whitespace-nowrap shadow-foreground drop-shadow-2xl cursor-default",
		className
	)}
>
	{@render children?.()}
</h1>
