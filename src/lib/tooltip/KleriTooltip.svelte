<script lang="ts">
	import { Tooltip } from "bits-ui";
	import { type Snippet } from "svelte";

	type Props = Tooltip.RootProps & {
		trigger: Snippet<[Record<string, unknown>]>;
		children?: Snippet<[]>;
		triggerProps?: Tooltip.TriggerProps;
		side?: "top" | "right" | "bottom" | "left";
		sideOffset?: number;
		arrow?: boolean;
		disabled?: boolean;
	};

	let {
		open = $bindable(false),
		arrow = false,
		children,
		side = "bottom",
		sideOffset,
		triggerProps = {},
		trigger,
		disabled = false,
	}: Props = $props();
</script>

<Tooltip.Root bind:open {disabled}>
	<Tooltip.Trigger {...triggerProps}>
		{#snippet child({ props })}
			{@render trigger(props)}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content
			class="z-50 text-sm font-spacemono font-normal
	    bg-background/60 text-foreground p-2 pointer-events-none
		  backdrop-blur-lg rounded-kleri border-2 border-border transition-transform"
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
