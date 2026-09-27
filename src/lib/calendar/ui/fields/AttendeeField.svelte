<script lang="ts">
	import { Loader2, UserPlus, X } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import KleriFieldLabel from '$lib/input/KleriFieldLabel.svelte';
	import { FIELD_ROOT, fieldShell } from '$lib/input/field.js';
	import { getCalendarContext } from '../../context.js';
	import type { CalendarAttendee, CalendarPerson, TimeInterval } from '../../types.js';
	import { isBusy } from '../../core/availability.js';
	import { avatarColor, initials, isValidEmail, parsePerson } from '../people.js';

	/**
	 * Guest list editor: type or paste emails (commas, semicolons and
	 * `Name <email>` all work), pick from `contacts`, mark guests optional, and
	 * see each guest's availability for the chosen time.
	 */
	interface Props {
		attendees: CalendarAttendee[];
		contacts?: CalendarPerson[];
		/** Busy time per email, or `null` when unknown. */
		busy?: Record<string, TimeInterval[]> | null;
		loadingBusy?: boolean;
		/** Instants of the proposed meeting, for availability dots. */
		start: Date;
		end: Date;
		/** The organizer, shown but not removable. */
		organizerEmail?: string;
		errors?: string[];
	}

	let {
		attendees = $bindable([]),
		contacts = [],
		busy = null,
		loadingBusy = false,
		start,
		end,
		organizerEmail,
		errors = $bindable([])
	}: Props = $props();

	const ctx = getCalendarContext();
	const uid = $props.id();

	let query = $state('');
	let open = $state(false);
	let highlighted = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	let suggestions = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const taken = new Set(attendees.map((a) => a.email.toLowerCase()));
		return contacts
			.filter((c) => !taken.has(c.email.toLowerCase()))
			.filter((c) => !q || c.email.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q))
			.slice(0, 6);
	});

	function add(person: CalendarPerson) {
		open = false;
		const email = person.email.trim();
		if (attendees.some((a) => a.email.toLowerCase() === email.toLowerCase())) return;
		attendees = [...attendees, { ...person, email, response: 'needsAction' }];
	}

	/** Adds every complete address in the input; leaves anything invalid for the user to fix. */
	function commit(): boolean {
		const parts = query
			.split(/[,;\n]+/)
			.map((p) => p.trim())
			.filter(Boolean);
		if (!parts.length) return true;
		const invalid: string[] = [];
		for (const part of parts) {
			const person = parsePerson(part);
			if (person)
				add(contacts.find((c) => c.email.toLowerCase() === person.email.toLowerCase()) ?? person);
			else invalid.push(part);
		}
		query = invalid.join(', ');
		errors = invalid.length ? [ctx.labels.invalidEmail(invalid[0])] : [];
		return invalid.length === 0;
	}

	function remove(email: string) {
		attendees = attendees.filter((a) => a.email !== email);
	}

	function toggleOptional(email: string) {
		attendees = attendees.map((a) => (a.email === email ? { ...a, optional: !a.optional } : a));
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' && suggestions.length) {
			e.preventDefault();
			open = true;
			highlighted = (highlighted + 1) % suggestions.length;
		} else if (e.key === 'ArrowUp' && suggestions.length) {
			e.preventDefault();
			highlighted = (highlighted - 1 + suggestions.length) % suggestions.length;
		} else if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
			if (open && suggestions[highlighted] && !isValidEmail(query) && query.trim()) {
				e.preventDefault();
				add(suggestions[highlighted]);
				query = '';
			} else if (query.trim()) {
				if (e.key !== 'Tab') e.preventDefault();
				commit();
			}
		} else if (e.key === 'Backspace' && !query && attendees.length) {
			const last = attendees[attendees.length - 1];
			if (last.email !== organizerEmail) remove(last.email);
		} else if (e.key === 'Escape' && open) {
			e.stopPropagation();
			open = false;
		}
	}

	function availability(email: string): 'busy' | 'free' | 'unknown' {
		const intervals = busy?.[email];
		if (!intervals) return 'unknown';
		return isBusy(intervals, start, end) ? 'busy' : 'free';
	}
</script>

<div class={FIELD_ROOT}>
	<KleriFieldLabel label={ctx.labels.guestsField} {errors} for={uid} />
	<div class="relative">
		<div class={cn(fieldShell({ hasErrors: errors.length > 0 }), 'flex-wrap gap-1.5 py-1.5')}>
			<UserPlus class="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
			<input
				bind:this={inputEl}
				bind:value={query}
				id={uid}
				type="text"
				inputmode="email"
				autocomplete="off"
				placeholder={ctx.labels.addGuests}
				role="combobox"
				aria-expanded={open && suggestions.length > 0}
				aria-controls="{uid}-listbox"
				aria-autocomplete="list"
				aria-activedescendant={open && suggestions.length ? `${uid}-opt-${highlighted}` : undefined}
				class="min-w-40 flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
				oninput={() => {
					open = true;
					highlighted = 0;
					if (errors.length) errors = [];
				}}
				onfocus={() => (open = true)}
				onblur={() => {
					// Let a click on a suggestion land first.
					setTimeout(() => {
						open = false;
						commit();
					}, 120);
				}}
				onpaste={() => setTimeout(commit, 0)}
				onkeydown={onKeydown}
			/>
		</div>

		{#if open && suggestions.length > 0}
			<ul
				id="{uid}-listbox"
				role="listbox"
				class="kleri-dropdown absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-kleri border-2 border-border bg-popover p-1 shadow-xl"
				data-state="open"
				data-side="bottom"
			>
				{#each suggestions as person, i (person.email)}
					<li
						id="{uid}-opt-{i}"
						role="option"
						aria-selected={i === highlighted}
						class={cn(
							'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5',
							i === highlighted && 'bg-kleri-2/20'
						)}
						onpointerdown={(e) => {
							e.preventDefault();
							add(person);
							query = '';
							inputEl?.focus();
						}}
						onpointerenter={() => (highlighted = i)}
					>
						<span
							class="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
							style:background-color={avatarColor(person.email)}
						>
							{initials(person)}
						</span>
						<span class="min-w-0 leading-tight">
							<span class="block truncate text-sm">{person.name ?? person.email}</span>
							{#if person.name}<span class="block truncate text-[11px] text-muted-foreground"
									>{person.email}</span
								>{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if attendees.length}
		<ul class="mt-1 flex flex-col gap-1" aria-label={ctx.labels.guests(attendees.length)}>
			{#each attendees as attendee (attendee.email)}
				{@const state = availability(attendee.email)}
				{@const isOrganizer = attendee.email === organizerEmail || attendee.organizer}
				<li class="group/guest flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-muted/30">
					<span class="relative shrink-0">
						<span
							class="flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
							style:background-color={avatarColor(attendee.email)}
						>
							{initials(attendee)}
						</span>
						{#if loadingBusy}
							<Loader2
								class="absolute -right-1 -bottom-1 size-3.5 animate-spin rounded-full bg-background text-muted-foreground"
							/>
						{:else if state !== 'unknown'}
							<span
								class={cn(
									'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-background',
									state === 'busy' ? 'bg-destructive' : 'bg-emerald-500'
								)}
								title={state === 'busy' ? ctx.labels.busy : ctx.labels.free}
							></span>
						{/if}
					</span>
					<span class="min-w-0 flex-1 leading-tight">
						<span class="block truncate text-sm">{attendee.name ?? attendee.email}</span>
						<span class="block truncate text-[11px] text-muted-foreground">
							{#if isOrganizer}{ctx.labels.organizer}{:else if attendee.name}{attendee.email}{/if}
							{#if state === 'busy' && !loadingBusy}<span class="text-destructive">
									· {ctx.labels.busy}</span
								>{/if}
						</span>
					</span>
					{#if !isOrganizer}
						<button
							type="button"
							aria-pressed={Boolean(attendee.optional)}
							class={cn(
								'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
								attendee.optional
									? 'border-kleri-2 text-kleri-1 dark:text-kleri-2'
									: 'border-transparent text-muted-foreground opacity-0 group-focus-within/guest:opacity-100 group-hover/guest:opacity-100 hover:border-(--kc-line-strong)'
							)}
							onclick={() => toggleOptional(attendee.email)}
						>
							{ctx.labels.optional}
						</button>
						<button
							type="button"
							class="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
							aria-label={ctx.labels.removeGuest(attendee.name ?? attendee.email)}
							onclick={() => remove(attendee.email)}
						>
							<X class="size-3.5" />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
