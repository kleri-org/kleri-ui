<script lang="ts">
	import { Clock, X } from '@lucide/svelte';
	import KleriButton from '$lib/button/KleriButton/KleriButton.svelte';
	import { getCalendarContext, type WallRange } from '../context.js';
	import { addDays, isSameDay } from '../core/date.js';
	import CalendarSelect from './CalendarSelect.svelte';

	/** The small popover that appears where you clicked or dragged in a view. */
	interface Props {
		range: WallRange;
		calendarId: string;
		onSave: (title: string, calendarId: string) => void;
		onMore: (title: string, calendarId: string) => void;
		onCancel: () => void;
	}

	let { range, calendarId, onSave, onMore, onCancel }: Props = $props();
	const ctx = getCalendarContext();

	let title = $state('');
	// Starts from the parent's default, then follows the user's pick.
	let selectedCalendar = $derived(calendarId);

	let summary = $derived.by(() => {
		const { start, end, allDay } = range;
		if (allDay) {
			const last = addDays(end, -1);
			return isSameDay(start, last)
				? `${ctx.formatters.fullDate(start)} · ${ctx.labels.allDay}`
				: `${ctx.formatters.mediumDate(start)} – ${ctx.formatters.mediumDate(last)} · ${ctx.labels.allDay}`;
		}
		return `${ctx.formatters.mediumDate(start)} · ${ctx.formatters.timeRange(start, end)}`;
	});

	function submit(e: SubmitEvent) {
		e.preventDefault();
		onSave(title, selectedCalendar);
	}
</script>

<form class="flex flex-col gap-3 p-4" onsubmit={submit}>
	<div class="flex items-start gap-2">
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:value={title}
			autofocus
			placeholder={ctx.labels.addTitle}
			aria-label={ctx.labels.title}
			class="min-w-0 flex-1 border-0 border-b-2 border-(--kc-line-strong) bg-transparent px-0 pb-1.5 text-lg font-medium outline-none placeholder:text-muted-foreground focus:border-kleri-2 focus:ring-0"
		/>
		<button
			type="button"
			class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
			aria-label={ctx.labels.cancel}
			onclick={onCancel}
		>
			<X class="size-4" />
		</button>
	</div>

	<p class="flex items-center gap-2 text-sm text-muted-foreground">
		<Clock class="size-4 shrink-0" />
		<span>{summary}</span>
	</p>

	{#if ctx.store.writableCalendars.length > 1}
		<CalendarSelect calendars={ctx.store.writableCalendars} bind:value={selectedCalendar} compact />
	{/if}

	<div class="flex items-center justify-between gap-2 pt-1">
		<button
			type="button"
			class="rounded-kleri px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
			onclick={() => onMore(title, selectedCalendar)}
		>
			{ctx.labels.moreOptions}
		</button>
		<KleriButton type="submit" class="w-auto px-5 py-1.5 text-sm">{ctx.labels.save}</KleriButton>
	</div>
</form>
