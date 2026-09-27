/**
 * Time-zone support built on `Intl`, with no tz database of our own.
 *
 * The calendar lays out every view in *wall-clock* time. When the display zone
 * differs from the system zone, instants are converted to a local `Date` whose
 * fields read as the display zone's wall clock (`toWall`), and back again
 * (`toInstant`) before anything is saved. When no zone is given both are the
 * identity, so the common case costs nothing.
 */

export interface ZonedParts {
	year: number;
	/** 1-12 */
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
	let fmt = partsFormatters.get(timeZone);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat('en-US', {
			timeZone,
			hourCycle: 'h23',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		});
		partsFormatters.set(timeZone, fmt);
	}
	return fmt;
}

/** The wall-clock fields of `date` as seen in `timeZone`. */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
	const parts: Record<string, number> = {};
	for (const part of partsFormatter(timeZone).formatToParts(date)) {
		if (part.type !== 'literal') parts[part.type] = Number(part.value);
	}
	return {
		year: parts.year,
		month: parts.month,
		day: parts.day,
		// Some engines still report midnight as 24 even with h23.
		hour: parts.hour === 24 ? 0 : parts.hour,
		minute: parts.minute,
		second: parts.second
	};
}

/** Offset of `timeZone` from UTC at `date`, in minutes (e.g. `330` for Asia/Kolkata). */
export function getTimeZoneOffset(date: Date, timeZone: string): number {
	const p = getZonedParts(date, timeZone);
	const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	const actual = Math.floor(date.getTime() / 1000) * 1000;
	return Math.round((asUtc - actual) / 60_000);
}

/**
 * The instant at which `timeZone`'s wall clock reads `parts`. Wall times that
 * don't exist (inside a spring-forward gap) resolve forward, like every
 * calendar app does; ambiguous ones (a fall-back repeat) take the first.
 */
export function zonedPartsToInstant(parts: ZonedParts, timeZone: string): Date {
	const guess = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second
	);
	const first = guess - getTimeZoneOffset(new Date(guess), timeZone) * 60_000;
	const second = guess - getTimeZoneOffset(new Date(first), timeZone) * 60_000;
	if (first === second) return new Date(first);

	const readsBack = (instant: number) => {
		const p = getZonedParts(new Date(instant), timeZone);
		return p.day === parts.day && p.hour === parts.hour && p.minute === parts.minute;
	};
	const firstOk = readsBack(first);
	const secondOk = readsBack(second);
	if (firstOk && secondOk) return new Date(Math.min(first, second));
	if (firstOk) return new Date(first);
	if (secondOk) return new Date(second);
	return new Date(Math.max(first, second));
}

export function getSystemTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
}

export function isValidTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone });
		return true;
	} catch {
		return false;
	}
}

const FALLBACK_ZONES = [
	'UTC',
	'America/Los_Angeles',
	'America/Denver',
	'America/Chicago',
	'America/New_York',
	'America/Sao_Paulo',
	'Europe/London',
	'Europe/Berlin',
	'Europe/Paris',
	'Africa/Johannesburg',
	'Asia/Dubai',
	'Asia/Kolkata',
	'Asia/Singapore',
	'Asia/Shanghai',
	'Asia/Tokyo',
	'Australia/Sydney',
	'Pacific/Auckland'
];

/** Every IANA zone the runtime knows, or a representative list on old engines. */
export function listTimeZones(): string[] {
	const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
	try {
		const zones = intl.supportedValuesOf?.('timeZone');
		if (zones?.length) return zones.includes('UTC') ? zones : ['UTC', ...zones];
	} catch {
		// fall through
	}
	return FALLBACK_ZONES;
}

/** `GMT+05:30` style offset label for `timeZone` at `date`. */
export function formatOffset(date: Date, timeZone: string): string {
	const offset = getTimeZoneOffset(date, timeZone);
	const sign = offset < 0 ? '-' : '+';
	const abs = Math.abs(offset);
	const h = String(Math.floor(abs / 60)).padStart(2, '0');
	const m = String(abs % 60).padStart(2, '0');
	return `GMT${sign}${h}:${m}`;
}

/** e.g. `(GMT+05:30) Asia/Kolkata`, readable and sortable. */
export function formatTimeZoneLabel(timeZone: string, date: Date = new Date()): string {
	return `(${formatOffset(date, timeZone)}) ${timeZone.replaceAll('_', ' ')}`;
}

export interface ZonedClock {
	/** The display zone, or the system zone when none was requested. */
	readonly timeZone: string;
	/** `true` when no conversion happens. */
	readonly isSystem: boolean;
	/** Instant → local `Date` whose fields show the display zone's wall clock. */
	toWall(instant: Date): Date;
	/** Inverse of `toWall`. */
	toInstant(wall: Date): Date;
}

export function createZonedClock(timeZone?: string | null): ZonedClock {
	const system = getSystemTimeZone();
	if (!timeZone || timeZone === system || !isValidTimeZone(timeZone)) {
		return {
			timeZone: system,
			isSystem: true,
			toWall: (d) => new Date(d),
			toInstant: (d) => new Date(d)
		};
	}
	return {
		timeZone,
		isSystem: false,
		toWall(instant) {
			const p = getZonedParts(instant, timeZone);
			return new Date(
				p.year,
				p.month - 1,
				p.day,
				p.hour,
				p.minute,
				p.second,
				instant.getMilliseconds()
			);
		},
		toInstant(wall) {
			return zonedPartsToInstant(
				{
					year: wall.getFullYear(),
					month: wall.getMonth() + 1,
					day: wall.getDate(),
					hour: wall.getHours(),
					minute: wall.getMinutes(),
					second: wall.getSeconds()
				},
				timeZone
			);
		}
	};
}
