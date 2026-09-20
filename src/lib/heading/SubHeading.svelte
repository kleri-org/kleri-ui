<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { InfoIcon, TriangleAlert } from '@lucide/svelte';

	interface Props {
		children: Snippet;
		class?: ClassValue | null | undefined;
		info?: string;
		warning?: string;
	}

	let { children, class: className, info, warning }: Props = $props();
</script>

<!--
The info and warning banners are siblings of the heading, not children of it:
`<h1>` only accepts phrasing content, so nesting the `<div>`/`<hr>` inside it
produced invalid markup that browsers silently reparented.
-->
<h1 class={cn('mb-1 font-Poppins text-2xl font-bold text-accent', className)}>
	{@render children()}
</h1>

{#if info}
	<div class="flex flex-row items-center gap-x-2 py-1 font-spacemono text-sm text-foreground">
		<InfoIcon size={14} class="text-foreground" />
		{info}
	</div>
	<hr />
{/if}

{#if warning}
	<div
		class="mt-1 flex flex-row items-center gap-x-2 py-1 font-spacemono text-sm text-yellow-600 dark:text-yellow-500"
	>
		<TriangleAlert size={14} />
		{warning}
	</div>
	<hr />
{/if}
