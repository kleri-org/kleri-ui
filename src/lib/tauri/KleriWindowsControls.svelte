<script lang="ts">
	import { onMount } from 'svelte';
	import { Minus, Square, X } from '@lucide/svelte';
	import { platform } from '@tauri-apps/plugin-os';
	import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

	let currentOs = $state('');

	let {
		appWindow,
		maximizable = true,
		buttonHeight = 'h-10'
	}: {
		appWindow: WebviewWindow;
		maximizable?: boolean;
		buttonHeight?: string;
	} = $props();

	onMount(async () => {
		if (typeof window !== 'undefined' && '__TAURI__' in window) {
			currentOs = platform();
		}
	});
</script>

<div
	data-tauri-drag-region
	class="absolute top-0 z-99 flex min-h-10 w-full flex-row justify-end bg-transparent"
>
	{#if currentOs === 'linux' || currentOs === 'windows'}
		<button
			class="inline-flex {buttonHeight} w-12.5 items-center justify-center text-foreground select-none hover:bg-muted-foreground"
			onclick={() => {
				appWindow.minimize();
				console.log('Minimized');
			}}
		>
			<Minus size={20} strokeWidth={2} />
		</button>
		{#if maximizable}
			<button
				class="inline-flex {buttonHeight} w-12.5 items-center justify-center text-foreground select-none hover:bg-muted-foreground"
				onclick={() => appWindow.toggleMaximize()}
			>
				<Square size={15} strokeWidth={2.5} />
			</button>
		{/if}
		<button
			class="inline-flex {buttonHeight} w-12.5 items-center justify-center text-foreground select-none hover:bg-red-600"
			onclick={() => appWindow.close()}
		>
			<X size={20} strokeWidth={2} />
		</button>
	{/if}
</div>
