<script lang="ts" module>
	export interface CalendarToast {
		id: string;
		message: string;
		tone?: 'default' | 'error';
		action?: { label: string; run: () => void };
	}
</script>

<script lang="ts">
	import { AlertCircle, CheckCircle2, X } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { getCalendarContext } from '../context.js';

	interface Props {
		toasts: CalendarToast[];
		onDismiss: (id: string) => void;
	}

	let { toasts, onDismiss }: Props = $props();
	const ctx = getCalendarContext();
</script>

<div
	class="pointer-events-none absolute inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
	role="region"
	aria-label="Notifications"
>
	{#each toasts as toast (toast.id)}
		<div
			role={toast.tone === 'error' ? 'alert' : 'status'}
			class={cn(
				// CSS enter animation, like the library's other overlays (no JS transitions).
				'pointer-events-auto flex max-w-md animate-in items-center gap-3 rounded-kleri border kleri-glass py-2 pr-2 pl-3 text-sm text-popover-foreground shadow-xl shadow-black/30 duration-200 fade-in-0 slide-in-from-bottom-4 motion-reduce:animate-none',
				toast.tone === 'error' ? 'border-destructive/60' : 'border-border/50'
			)}
		>
			{#if toast.tone === 'error'}
				<AlertCircle class="size-4 shrink-0 text-destructive" />
			{:else}
				<CheckCircle2 class="size-4 shrink-0 text-brand" />
			{/if}
			<span class="min-w-0 flex-1">{toast.message}</span>
			{#if toast.action}
				<button
					type="button"
					class="shrink-0 rounded-lg px-2 py-1 font-medium text-brand transition-colors hover:bg-kleri-2/15"
					onclick={() => {
						toast.action?.run();
						onDismiss(toast.id);
					}}
				>
					{toast.action.label}
				</button>
			{/if}
			<button
				type="button"
				class="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
				aria-label={ctx.labels.close}
				onclick={() => onDismiss(toast.id)}
			>
				<X class="size-3.5" />
			</button>
		</div>
	{/each}
</div>
