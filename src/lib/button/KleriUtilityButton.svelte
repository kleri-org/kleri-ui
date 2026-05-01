<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils";
	import { cn } from "$lib/utils";
	import KleriTooltip from "$lib/tooltip/KleriTooltip.svelte";

	type ButtonProps = WithElementRef<HTMLButtonAttributes>;

	let {
		children,
		class: className,
		tooltip, // Add tooltip prop with default value
		...restProps
	}: ButtonProps & { tooltip?: string } = $props();
</script>

<KleriTooltip side="bottom" sideOffset={5}>
	{#snippet trigger()}
		<button
			class={cn(
				"btn w-full text-base border-2 p-2 align-center rounded-kleri  text-white ring-0 font-normal hover:shadow-black/50 hover:text-black bg-none hover:bg-accent hover:ring-0 disabled:cursor-not-allowed disabled:kleri-bg disabled:text-black disabled:ring-0 disabled:shadow-none disabled:border-none",
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</button>
	{/snippet}
	{#if tooltip}<p>{tooltip}</p>{/if}
</KleriTooltip>
