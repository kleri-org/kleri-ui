import type { CalendarPerson } from '../types.js';
import { readableInk } from '../core/color.js';

/** One or two initials for an avatar. */
export function initials(person: CalendarPerson): string {
	const source = person.name?.trim() || person.email.split('@')[0];
	const words = source.split(/[\s._-]+/).filter(Boolean);
	const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : source.slice(0, 2);
	return letters.toUpperCase();
}

const AVATAR_COLORS = [
	'#196072',
	'#239190',
	'#3a7ca5',
	'#6c5fc7',
	'#b0568f',
	'#c2703d',
	'#5c8a3a',
	'#4f6d7a'
];

/** A stable avatar background derived from the email. */
export function avatarColor(email: string): string {
	let hash = 0;
	for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0;
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Initials colour that stays legible on `avatarColor(email)`. */
export function avatarInk(email: string): string {
	return readableInk(avatarColor(email));
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
	return EMAIL_PATTERN.test(value.trim());
}

/** Parses `Ada Lovelace <ada@example.com>` or a bare address. */
export function parsePerson(input: string): CalendarPerson | null {
	const trimmed = input.trim().replace(/[,;]$/, '');
	const match = /^(.*)<([^>]+)>$/.exec(trimmed);
	if (match) {
		const email = match[2].trim();
		const name = match[1].trim().replace(/^"|"$/g, '');
		return isValidEmail(email) ? (name ? { email, name } : { email }) : null;
	}
	return isValidEmail(trimmed) ? { email: trimmed } : null;
}
