import type { Component } from 'svelte';
import { CalendarDays, CalendarRange, Columns3, LayoutGrid, List } from '@lucide/svelte';
import {
	addDays,
	addMonths,
	endOfMonthExclusive,
	startOfDay,
	startOfMonth,
	startOfWeek
} from '../core/date.js';
import { dateFormatter, formatDateRange } from '../core/format.js';
import type { CalendarViewDefinition, ViewRangeContext } from './types.js';
import TimeGridView from './TimeGridView.svelte';
import MonthView from './MonthView.svelte';
import AgendaView from './AgendaView.svelte';

function monthSpanTitle(start: Date, endExclusive: Date, context: ViewRangeContext): string {
	const last = addDays(endExclusive, -1);
	if (start.getMonth() === last.getMonth() && start.getFullYear() === last.getFullYear()) {
		return context.formatters.monthYear(start);
	}
	const fmt = dateFormatter(context.locale, { month: 'short', year: 'numeric' });
	try {
		return fmt.formatRange(start, last);
	} catch {
		return `${fmt.format(start)} – ${fmt.format(last)}`;
	}
}

export interface TimeGridViewOptions {
	id: string;
	label: string;
	/** A number of days starting at the focus date, or `'week'` for the focus date's week. */
	days: number | 'week';
	icon?: Component;
	shortcut?: string;
}

/** A column-per-day time grid: day, week, 3-day, work week… */
export function createTimeGridView(options: TimeGridViewOptions): CalendarViewDefinition {
	const { days } = options;
	return {
		id: options.id,
		label: options.label,
		icon: options.icon,
		shortcut: options.shortcut,
		component: TimeGridView,
		range(date, context) {
			const start = days === 'week' ? startOfWeek(date, context.weekStartsOn) : startOfDay(date);
			return { start, end: addDays(start, days === 'week' ? 7 : days) };
		},
		step(date, direction) {
			return addDays(date, (days === 'week' ? 7 : days) * direction);
		},
		title(range, context) {
			if (days === 1) {
				return dateFormatter(context.locale, {
					month: 'long',
					day: 'numeric',
					year: 'numeric'
				}).format(range.start);
			}
			return monthSpanTitle(range.start, range.end, context);
		}
	};
}

export interface MonthViewOptions {
	id?: string;
	label?: string;
	/** Always render six weeks, so the grid never changes height. @default false */
	fixedWeeks?: boolean;
	icon?: Component;
	shortcut?: string;
}

export function createMonthView(options: MonthViewOptions = {}): CalendarViewDefinition {
	return {
		id: options.id ?? 'month',
		label: options.label ?? 'Month',
		icon: options.icon ?? LayoutGrid,
		shortcut: options.shortcut ?? 'm',
		component: MonthView,
		range(date, context) {
			const start = startOfWeek(startOfMonth(date), context.weekStartsOn);
			if (options.fixedWeeks) return { start, end: addDays(start, 42) };
			const monthEnd = endOfMonthExclusive(date);
			let end = startOfWeek(monthEnd, context.weekStartsOn);
			if (end < monthEnd) end = addDays(end, 7);
			return { start, end };
		},
		step(date, direction) {
			return addMonths(date, direction);
		},
		title(range, context) {
			// The month is whichever one owns the middle of the grid.
			return context.formatters.monthYear(addDays(range.start, 14));
		}
	};
}

export interface AgendaViewOptions {
	id?: string;
	label?: string;
	/** Days listed per page. @default 30 */
	days?: number;
	icon?: Component;
	shortcut?: string;
}

/** A chronological list, grouped by day. */
export function createAgendaView(options: AgendaViewOptions = {}): CalendarViewDefinition {
	const days = options.days ?? 30;
	return {
		id: options.id ?? 'agenda',
		label: options.label ?? 'Agenda',
		icon: options.icon ?? List,
		shortcut: options.shortcut ?? 'a',
		component: AgendaView,
		range(date) {
			const start = startOfDay(date);
			return { start, end: addDays(start, days) };
		},
		step(date, direction) {
			return addDays(date, days * direction);
		},
		title(range, context) {
			return formatDateRange(context.locale, range.start, addDays(range.end, -1));
		}
	};
}

export const dayView = createTimeGridView({
	id: 'day',
	label: 'Day',
	days: 1,
	icon: CalendarDays,
	shortcut: 'd'
});
export const weekView = createTimeGridView({
	id: 'week',
	label: 'Week',
	days: 'week',
	icon: Columns3,
	shortcut: 'w'
});
export const threeDayView = createTimeGridView({
	id: '3day',
	label: '3 days',
	days: 3,
	icon: CalendarRange,
	shortcut: 'x'
});
export const monthView = createMonthView();
export const agendaView = createAgendaView();

/** Day, Week, Month and Agenda — the views `KleriCalendar` shows by default. */
export const defaultCalendarViews: CalendarViewDefinition[] = [
	dayView,
	weekView,
	monthView,
	agendaView
];
