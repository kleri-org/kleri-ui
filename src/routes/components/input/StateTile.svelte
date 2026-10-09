<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		/** Names the state shown, e.g. "Rest" or "Error". */
		caption: string;
		/**
		 * Paints the focus treatment without real focus, so several states can be
		 * seen side by side. Targets the field shell, switch, slider thumb and the
		 * first toggle item.
		 */
		focus?: boolean;
		children: Snippet;
	}

	let { caption, focus = false, children }: Props = $props();
</script>

<figure class="flex min-w-0 flex-col justify-between gap-2">
	<!-- The gallery is a picture of each state; the playground below is the
	     one to use, so these stay out of the tab order and the a11y tree. -->
	<div
		inert
		class={cn(
			'flex min-h-20 items-center',
			focus && [
				'[&_[data-slot=field-shell]]:kleri-border dark:[&_[data-slot=field-shell]]:kleri-border-dark',
				'[&_.kleri-switch]:outline-2 [&_.kleri-switch]:outline-offset-2 [&_.kleri-switch]:outline-ring [&_.kleri-switch]:outline-solid',
				'[&_[data-slider-thumb]]:ring-2 [&_[data-slider-thumb]]:ring-ring [&_[data-slider-thumb]]:ring-offset-2 [&_[data-slider-thumb]]:ring-offset-background',
				'[&_[data-slot=kleri-toggle-group-item]:first-child]:outline-2 [&_[data-slot=kleri-toggle-group-item]:first-child]:outline-offset-2 [&_[data-slot=kleri-toggle-group-item]:first-child]:outline-ring [&_[data-slot=kleri-toggle-group-item]:first-child]:outline-solid'
			]
		)}
	>
		{@render children()}
	</div>
	<figcaption class="ps-2 font-spacemono text-xs text-muted-foreground">{caption}</figcaption>
</figure>
