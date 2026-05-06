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

<h1 class={cn('mb-1 font-Poppins text-2xl font-bold text-accent', className)}>
	{@render children?.()}

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
</h1>
