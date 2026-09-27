<script lang="ts">
	import { CalendarDays, Rss, Cloud } from '@lucide/svelte';
	import type { CalendarProviderKind } from '../types.js';

	/** Small mark identifying where a calendar comes from. */
	interface Props {
		kind: CalendarProviderKind;
		class?: string;
	}

	let { kind, class: className = 'size-4' }: Props = $props();
</script>

{#if kind === 'google'}
	<svg class={className} viewBox="0 0 24 24" aria-hidden="true">
		<path
			fill="#4285F4"
			d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"
		/>
		<path
			fill="#34A853"
			d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"
		/>
		<path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
		<path
			fill="#EA4335"
			d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
		/>
	</svg>
{:else if kind === 'microsoft'}
	<svg class={className} viewBox="0 0 24 24" aria-hidden="true">
		<path fill="#F25022" d="M1 1h10.5v10.5H1z" />
		<path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
		<path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
		<path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
	</svg>
{:else if kind === 'ics'}
	<Rss class={className} aria-hidden="true" />
{:else if kind === 'local'}
	<CalendarDays class={className} aria-hidden="true" />
{:else}
	<Cloud class={className} aria-hidden="true" />
{/if}
