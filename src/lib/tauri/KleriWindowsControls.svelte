<script lang="ts">
	import { Minus, Square, X } from '@lucide/svelte';
	import { WebviewWindow, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
	import { platform, type Platform } from '@tauri-apps/plugin-os';
	import { isTauri } from '@tauri-apps/api/core';
	import { onMount } from 'svelte';

	// `platform()` reads `window.__TAURI_OS_PLUGIN_INTERNALS__`, so it is only safe after mount
	// and only inside a Tauri webview.
	let currentOs = $state<Platform | undefined>(undefined);

	onMount(() => {
		if (isTauri()) currentOs = platform();
	});

	let {
		appWindow = isTauri() ? getCurrentWebviewWindow() : undefined,
		maximizable = true,
		buttonHeight = 'h-10',
		floating = false,
		absolute = true
	}: {
		appWindow?: WebviewWindow;
		maximizable?: boolean;
		buttonHeight?: string;
		floating?: boolean;
		absolute?: boolean;
	} = $props();

	let btnHeight = $derived(floating ? 'h-8' : buttonHeight);
</script>

<div
	data-tauri-drag-region
	class="{absolute ? 'absolute top-0 z-99 w-full' : 'relative'} flex min-h-10 flex-row justify-end bg-transparent"
	class:pt-2={floating}
	class:pr-2={floating}
>
	{#if currentOs === 'linux' || currentOs === 'windows'}
		<button
			class="inline-flex {btnHeight} {floating
				? 'w-11 rounded-kleri'
				: 'w-12.5'} items-center justify-center text-foreground select-none hover:bg-muted-foreground"
			onclick={() => appWindow?.minimize()}
		>
			<Minus size={20} strokeWidth={2} aria-hidden="true" />
		</button>

		{#if maximizable}
			<button
				class="inline-flex {btnHeight} {floating
					? 'w-11 rounded-kleri'
					: 'w-12.5'} items-center justify-center text-foreground select-none hover:bg-muted-foreground"
				onclick={() => appWindow?.toggleMaximize()}
			>
				<Square size={15} strokeWidth={2.5} aria-hidden="true" />
			</button>
		{/if}

		<button
			class="inline-flex {btnHeight} {floating
				? 'w-11 rounded-kleri'
				: 'w-12.5'} items-center justify-center text-foreground select-none hover:bg-red-500 hover:text-black"
			onclick={() => appWindow?.close()}
		>
			<X size={20} strokeWidth={2} aria-hidden="true" />
		</button>
	{/if}
</div>
