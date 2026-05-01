<script lang="ts">
	import { cn } from "$lib/utils";
	import type { ClassValue } from "clsx";
	import type { Snippet } from "svelte";

	interface Props {
		name: Snippet;
		option: Snippet;
		class?: ClassValue | null | undefined;
		optionAtEnd?: boolean;
	}

	let { name, option, class: className, optionAtEnd = false }: Props = $props();
</script>

<div class={cn("flex flex-col w-full my-5", className)}>
	<!-- Reset Settings -->
	<div class="grid gap-2 items-center grid-cols-3 w-full h-12">
		<div class="text-left font-medium col-span-2">
			<p>
				{@render name?.()}
			</p>
		</div>
		<div class={optionAtEnd ? "justify-self-end pr-2" : ""}>
			{@render option?.()}
		</div>
	</div>
</div>
