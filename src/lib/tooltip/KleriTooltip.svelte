<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import { type Snippet } from 'svelte';

	type Props = Omit<Tooltip.RootProps, 'children' | 'child'> & {
		/** Trigger element, rendered with the props bits-ui needs on it. */
		trigger: Snippet<[Record<string, unknown>]>;
		/** Tooltip body. */
		children?: Snippet<[]>;
		triggerProps?: Tooltip.TriggerProps;
		side?: 'top' | 'right' | 'bottom' | 'left';
		sideOffset?: number;
		arrow?: boolean;
	};

	let {
		open = $bindable(false),
		arrow = false,
		children,
		side = 'bottom',
		sideOffset,
		triggerProps = {},
		trigger,
		...restProps
	}: Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root bind:open {...restProps}>
		<Tooltip.Trigger {...triggerProps}>
			{#snippet child({ props })}
				{@render trigger(props)}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Portal>
			<Tooltip.Content
				role="tooltip"
				class="pointer-events-none z-50 rounded-kleri border-2
		    border-border bg-background/60 p-2 font-spacemono
			  text-sm font-normal text-foreground backdrop-blur-lg transition-transform"
				{side}
				{sideOffset}
			>
				{#if arrow}
					<Tooltip.Arrow class="pointer-events-none text-foreground/40 transition-transform" />
				{/if}
				<div class="pointer-events-none text-xs">
					{@render children?.()}
				</div>
			</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
</Tooltip.Provider>
