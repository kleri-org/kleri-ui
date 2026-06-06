<script lang="ts">
	import { Minus, Square, X } from '@lucide/svelte';
	import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
	import { platform } from '@tauri-apps/plugin-os';

	let currentOs = platform();

	let {
		appWindow = undefined,
		maximizable = true,
		buttonHeight = 'h-10',
		floating = false
	}: {
		appWindow?: WebviewWindow;
		maximizable?: boolean;
		buttonHeight?: string;
		floating?: boolean;
	} = $props();

	let btnHeight = $derived(floating ? 'h-8' : buttonHeight);
</script>

<div
	data-tauri-drag-region
	class="absolute top-0 z-99 flex min-h-10 w-full flex-row justify-end bg-transparent"
	class:pt-2={floating}
	class:pr-2={floating}
>
	{#if currentOs === 'linux' || currentOs === 'windows'}
		<button
			class="inline-flex {btnHeight} {floating
				? 'w-11 rounded-kleri'
				: 'w-12.5'} items-center justify-center text-foreground select-none hover:bg-muted-foreground"
			onclick={() => {
				appWindow?.minimize();
				console.log('Minimized');
			}}
		>
			<Minus size={20} strokeWidth={2} />
		</button>

		{#if maximizable}
			<button
				class="inline-flex {btnHeight} {floating
					? 'w-11 rounded-kleri'
					: 'w-12.5'} items-center justify-center text-foreground select-none hover:bg-muted-foreground"
				onclick={() => appWindow?.toggleMaximize()}
			>
				<Square size={15} strokeWidth={2.5} />
			</button>
		{/if}

		<button
			class="inline-flex {btnHeight} {floating
				? 'w-11 rounded-kleri'
				: 'w-12.5'} items-center justify-center text-foreground select-none hover:bg-red-500 hover:text-black"
			onclick={() => appWindow?.close()}
		>
			<X size={20} strokeWidth={2} />
		</button>
	{/if}
</div>
