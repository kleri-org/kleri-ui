<script lang="ts">
	import { cn } from '$lib/utils';
	import type { ClassValue } from 'clsx';
	import type { Snippet } from 'svelte';

	interface Props {
		name: Snippet;
		option: Snippet;
		class?: ClassValue | null | undefined;
		optionAtEnd?: boolean;
	}

	let { name, option, class: className, optionAtEnd = false }: Props = $props();
</script>

<div class={cn('my-5 flex w-full flex-col', className)}>
	<!-- Reset Settings -->
	<div class="grid h-12 w-full grid-cols-3 items-center gap-2">
		<div class="col-span-2 text-left font-medium">
			<p>
				{@render name?.()}
			</p>
		</div>
		<div class={optionAtEnd ? 'justify-self-end pr-2' : ''}>
			{@render option?.()}
		</div>
	</div>
</div>
