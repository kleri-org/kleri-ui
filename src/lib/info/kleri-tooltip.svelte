<script lang="ts">
	import { Tooltip } from "bits-ui";
	import { type Snippet } from "svelte";

	type Props = Tooltip.RootProps & {
		trigger: Snippet<[]>;
		children?: Snippet<[]>;
		triggerProps?: Tooltip.TriggerProps;
		side?: "top" | "right" | "bottom" | "left";
		sideOffset?: number;
		arrow?: boolean;
	};

	let {
		open = $bindable(false),
		arrow,
		children,
		side = "bottom",
		sideOffset,
		triggerProps = {},
		trigger,
	}: Props = $props();
</script>

<Tooltip.Root bind:open>
	<Tooltip.Trigger {...triggerProps}>
		{@render trigger()}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content
			class="z-50 text-sm font-spacemono 
	    bg-background/40 text-foreground p-2 pointer-events-none
		  backdrop-blur-xl rounded-lg border border-border transition-transform"
			{side}
			{sideOffset}
		>
			{#if arrow}
				<Tooltip.Arrow class="text-foreground/40 pointer-events-none transition-transform" />
			{/if}
			<div class="pointer-events-none text-xs">
				{@render children?.()}
			</div>
		</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>
