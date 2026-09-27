import {
	addDays,
	createMemoryProvider,
	createIcsFeedProvider,
	startOfWeek,
	toDateKey,
	type CalendarIntegration,
	type CalendarPerson,
	type ConferenceProvider,
	type ProviderEvent
} from '$lib/calendar/index.js';

/**
 * Seed data for the preview page, anchored to the current week so the demo
 * always has something happening "today".
 */

export const SELF: CalendarPerson = { email: 'you@kleri.org', name: 'You' };

export const CONTACTS: CalendarPerson[] = [
	{ email: 'ada@kleri.org', name: 'Ada Lovelace' },
	{ email: 'grace@kleri.org', name: 'Grace Hopper' },
	{ email: 'alan@kleri.org', name: 'Alan Turing' },
	{ email: 'katherine@kleri.org', name: 'Katherine Johnson' },
	{ email: 'margaret@kleri.org', name: 'Margaret Hamilton' },
	{ email: 'linus@kleri.org', name: 'Linus Torvalds' },
	{ email: 'sam@example.com', name: 'Sam Rivera' }
];

const [ada, grace, alan, katherine, margaret] = CONTACTS;
const me = { ...SELF, response: 'accepted' as const };

function at(day: Date, hours: number, minutes = 0): Date {
	const d = new Date(day);
	d.setHours(hours, minutes, 0, 0);
	return d;
}

function meet(code: string) {
	return {
		url: `https://meet.google.com/${code}`,
		kind: 'google-meet' as const,
		label: 'Google Meet'
	};
}

export function buildDemoProviders() {
	const monday = startOfWeek(new Date(), 1);
	const day = (offset: number) => addDays(monday, offset);

	const work: ProviderEvent[] = [
		{
			id: 'standup',
			calendarId: 'work',
			title: 'Daily stand-up',
			start: at(day(-14), 9, 30),
			end: at(day(-14), 9, 45),
			recurrence: {
				freq: 'WEEKLY',
				byDay: ['MO', 'TU', 'WE', 'TH', 'FR'].map((d) => ({ day: d as 'MO' }))
			},
			conference: meet('kle-ri-std'),
			organizer: ada,
			attendees: [
				{ ...ada, organizer: true, response: 'accepted' },
				me,
				{ ...grace, response: 'accepted' },
				{ ...alan, response: 'tentative' }
			],
			reminders: [5]
		},
		{
			id: 'one-on-one',
			calendarId: 'work',
			title: '1:1 with Ada',
			start: at(day(-7 + 1), 14),
			end: at(day(-7 + 1), 14, 30),
			recurrence: { freq: 'WEEKLY', byDay: [{ day: 'TU' }] },
			conference: meet('ada-you-11'),
			attendees: [me, { ...ada, response: 'accepted' }],
			description: 'Running agenda: https://docs.kleri.org/1-1'
		},
		{
			id: 'design-review',
			calendarId: 'work',
			title: 'Design review — calendar',
			start: at(day(2), 11),
			end: at(day(2), 12),
			location: 'Studio 3, 4th floor',
			organizer: margaret,
			attendees: [
				{ ...margaret, organizer: true, response: 'accepted' },
				{ ...SELF, response: 'tentative' },
				{ ...ada, response: 'accepted' },
				{ ...katherine, response: 'needsAction' }
			],
			description:
				'Walk through the new scheduling flows.\nBring feedback on drag & drop and the find-a-time panel.',
			reminders: [10, 60]
		},
		{
			id: 'hiring-sync',
			calendarId: 'work',
			title: 'Hiring sync',
			start: at(day(2), 11),
			end: at(day(2), 11, 45),
			attendees: [me, { ...grace, response: 'accepted' }]
		},
		{
			id: 'vendor-call',
			calendarId: 'work',
			title: 'Vendor call',
			start: at(day(2), 11, 30),
			end: at(day(2), 12, 30),
			conference: { url: 'https://acme.zoom.us/j/98765432100', kind: 'zoom', label: 'Zoom' }
		},
		{
			id: 'arch-deep-dive',
			calendarId: 'work',
			title: 'Architecture deep-dive',
			start: at(day(3), 15),
			end: at(day(3), 16),
			organizer: alan,
			attendees: [
				{ ...alan, organizer: true, response: 'accepted' },
				{ ...SELF, response: 'needsAction' },
				{ ...katherine, response: 'accepted' }
			],
			conference: meet('arc-hdd-kle')
		},
		{
			id: 'brown-bag',
			calendarId: 'work',
			title: 'Brown bag: accessibility',
			start: at(day(1), 12, 30),
			end: at(day(1), 13, 30),
			attendees: [
				{ ...SELF, response: 'declined' },
				{ ...katherine, response: 'accepted', organizer: true }
			],
			transparency: 'free'
		},
		{
			id: 'release',
			calendarId: 'work',
			title: 'Release v2.0',
			start: at(new Date(), 0),
			end: addDays(at(new Date(), 0), 1),
			allDay: true
		},
		{
			id: 'sprint-review',
			calendarId: 'work',
			title: 'Sprint review',
			start: at(day(-10), 15),
			end: at(day(-10), 16),
			recurrence: { freq: 'WEEKLY', interval: 2, byDay: [{ day: 'FR' }] },
			attendees: [
				me,
				{ ...ada, response: 'accepted' },
				{ ...grace, response: 'accepted' },
				{ ...alan, response: 'accepted' }
			]
		},
		{
			id: 'deploy',
			calendarId: 'work',
			title: 'Deploy window',
			start: at(day(5), 22),
			end: at(day(6), 1),
			location: 'War room'
		},
		{
			id: 'offsite',
			calendarId: 'work',
			title: 'Team offsite — Lisbon',
			start: day(7),
			end: day(10),
			allDay: true,
			location: 'Lisbon, Portugal'
		}
	];

	const team: ProviderEvent[] = [
		{
			id: 'grace-focus',
			calendarId: 'team',
			title: 'Grace — focus time',
			start: at(day(-7), 13),
			end: at(day(-7), 15),
			recurrence: {
				freq: 'WEEKLY',
				byDay: ['MO', 'TU', 'WE', 'TH'].map((d) => ({ day: d as 'MO' }))
			},
			attendees: [{ ...grace, response: 'accepted' }]
		},
		{
			id: 'ada-interviews',
			calendarId: 'team',
			title: 'Ada — interviews',
			start: at(day(3), 10),
			end: at(day(3), 12),
			attendees: [{ ...ada, response: 'accepted' }]
		}
	];

	const personal: ProviderEvent[] = [
		{
			id: 'gym',
			calendarId: 'personal',
			title: 'Gym',
			start: at(day(-14), 7),
			end: at(day(-14), 8),
			recurrence: { freq: 'WEEKLY', byDay: [{ day: 'MO' }, { day: 'WE' }, { day: 'FR' }] }
		},
		{
			id: 'dentist',
			calendarId: 'personal',
			title: 'Dentist',
			start: at(day(3), 16, 30),
			end: at(day(3), 17, 15),
			location: 'Smile Clinic'
		},
		{
			id: 'dinner',
			calendarId: 'personal',
			title: 'Dinner with Sam',
			start: at(day(4), 19, 30),
			end: at(day(4), 21, 30),
			location: 'Taberna do Mercado',
			attendees: [me, { email: 'sam@example.com', name: 'Sam Rivera', response: 'accepted' }]
		}
	];

	const local = createMemoryProvider({
		id: 'local',
		label: 'Kleri workspace',
		account: SELF.email,
		self: SELF,
		latency: 250,
		calendars: [
			{ id: 'work', name: 'Work', color: '#239190', primary: true },
			{ id: 'personal', name: 'Personal', color: '#e0a458' },
			{ id: 'team', name: 'Team availability', color: '#7a6fd6', readOnly: true }
		],
		events: [...work, ...team, ...personal]
	});

	const holiday = (offset: number, uid: string, title: string) => {
		const d = addDays(monday, offset);
		const next = addDays(d, 1);
		return [
			'BEGIN:VEVENT',
			`UID:${uid}@holidays.kleri.org`,
			`DTSTART;VALUE=DATE:${toDateKey(d).replaceAll('-', '')}`,
			`DTEND;VALUE=DATE:${toDateKey(next).replaceAll('-', '')}`,
			`SUMMARY:${title}`,
			'TRANSP:TRANSPARENT',
			'END:VEVENT'
		].join('\r\n');
	};

	const holidays = createIcsFeedProvider({
		id: 'ics:holidays',
		label: 'Subscriptions',
		color: '#d9667b',
		text: [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//Kleri//Demo holidays//EN',
			'X-WR-CALNAME:Holidays',
			holiday(4, 'founders', "Founders' Day"),
			holiday(18, 'harvest', 'Harvest Festival'),
			holiday(-9, 'spring', 'Spring Bank Holiday'),
			'END:VCALENDAR'
		].join('\r\n')
	});

	return [local, holidays];
}

let connections = 0;

/** Stand-ins for real OAuth flows: each resolves to a provider after a short delay. */
export const DEMO_INTEGRATIONS: CalendarIntegration[] = [
	{
		id: 'google',
		label: 'Google Calendar',
		description: 'Demo — simulates the OAuth round-trip',
		async connect() {
			await new Promise((r) => setTimeout(r, 900));
			const n = ++connections;
			const monday = startOfWeek(new Date(), 1);
			return createMemoryProvider({
				id: `google:demo-${n}`,
				kind: 'google',
				label: 'Google Calendar',
				account: `you+${n}@gmail.com`,
				latency: 400,
				calendars: [
					{ id: 'primary', name: 'Personal (Google)', color: '#4a90d9', primary: true },
					{ id: 'family', name: 'Family', color: '#8fb356' }
				],
				events: [
					{
						id: 'g1',
						calendarId: 'family',
						title: 'School pickup',
						start: at(addDays(monday, 1), 15, 30),
						end: at(addDays(monday, 1), 16),
						recurrence: { freq: 'WEEKLY', byDay: [{ day: 'TU' }, { day: 'TH' }] }
					},
					{
						id: 'g2',
						calendarId: 'primary',
						title: 'Book club',
						start: at(addDays(monday, 2), 18, 30),
						end: at(addDays(monday, 2), 20)
					}
				]
			});
		}
	},
	{
		id: 'microsoft',
		label: 'Outlook / Microsoft 365',
		description: 'Demo — simulates the MSAL sign-in',
		async connect() {
			await new Promise((r) => setTimeout(r, 900));
			const n = ++connections;
			const monday = startOfWeek(new Date(), 1);
			return createMemoryProvider({
				id: `microsoft:demo-${n}`,
				kind: 'microsoft',
				label: 'Outlook',
				account: `you${n}@contoso.com`,
				latency: 400,
				calendars: [{ id: 'calendar', name: 'Contoso', color: '#c77dba', primary: true }],
				events: [
					{
						id: 'm1',
						calendarId: 'calendar',
						title: 'Client QBR',
						start: at(addDays(monday, 3), 9),
						end: at(addDays(monday, 3), 10),
						conference: {
							url: 'https://teams.microsoft.com/l/meetup-join/demo',
							kind: 'teams',
							label: 'Microsoft Teams'
						}
					}
				]
			});
		}
	}
];

/** A custom conferencing hook, the way a Zoom integration would plug in. */
export const DEMO_CONFERENCING: ConferenceProvider[] = [
	{
		id: 'zoom',
		label: 'Zoom (demo)',
		kind: 'zoom',
		async create() {
			await new Promise((r) => setTimeout(r, 300));
			const id = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
			return { url: `https://zoom.us/j/${id}`, kind: 'zoom', label: 'Zoom' };
		}
	}
];
