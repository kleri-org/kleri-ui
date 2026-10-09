<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Anchor id. The docs sidebar and the e2e suite link to it. */
		id: string;
		title: string;
		description: string;
		/** Side-by-side gallery of the component's states, above the playground. */
		states?: Snippet;
		/** The live, prop-driven component. */
		stage: Snippet;
		controls: Snippet;
		code: Snippet;
	}

	let { id, title, description, states, stage, controls, code }: Props = $props();
</script>

<section {id} aria-labelledby="{id}-title" class="scroll-mt-8 space-y-6">
	<header class="max-w-prose space-y-1.5">
		<h3 id="{id}-title" class="text-2xl font-bold text-foreground">{title}</h3>
		<p class="text-muted-foreground">{description}</p>
	</header>

	{#if states}
		<div
			role="group"
			aria-label="{title} states"
			class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3"
		>
			{@render states()}
		</div>
	{/if}

	<!-- DOM order is demo, props, code, which is also the mobile order and the
	     tab order. On large screens the props panel moves into the right column
	     beside both. -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
		<div
			class="flex min-h-60 min-w-0 items-center justify-center rounded-kleri border border-border/50 bg-card/30 p-6 sm:p-12 lg:col-span-2"
		>
			{@render stage()}
		</div>
		<div
			class="rounded-kleri border border-border/50 bg-card/30 p-6 lg:col-start-3 lg:row-span-2 lg:row-start-1"
		>
			<h4
				class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
			>
				Props
			</h4>
			{@render controls()}
		</div>
		<div class="min-w-0 lg:col-span-2 lg:row-start-2">
			{@render code()}
		</div>
	</div>
</section>
