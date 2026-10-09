<script lang="ts" module>
	/** Defaults every text-style field shares; the snippets leave these out. */
	const FIELD_DEFAULTS = {
		placeholder: '',
		type: 'text',
		required: false,
		disabled: false,
		withBorder: true,
		errors: [],
		shake: false
	};
</script>

<script lang="ts">
	import KleriSwitch from '$lib/input/KleriSwitch.svelte';
	import KleriInput from '$lib/input/KleriInput.svelte';
	import KleriCombobox from '$lib/input/KleriCombobox.svelte';
	import KleriSelect from '$lib/input/KleriSelect.svelte';
	import KleriTextarea from '$lib/input/KleriTextarea.svelte';
	import KleriSlider from '$lib/input/KleriSlider.svelte';
	import KleriDragNDrop from '$lib/input/dragndrop/KleriDragNDrop.svelte';
	import type { FileTypeName } from '$lib/input/dragndrop/dragndrop-utils.js';
	import PrimaryHeading from '$lib/heading/PrimaryHeading.svelte';
	import { KleriToggleGroup, KleriToggleGroupItem, kleriToggleActiveClass } from '$lib/toggle';
	import { PropControls, CodePreview, type PropSchema } from '$lib/preview';
	import { Check, Landmark, NotebookPen, Scale, X } from '@lucide/svelte';
	import DemoSection from './DemoSection.svelte';
	import StateTile from './StateTile.svelte';

	/** Wraps the "Error message" control's text in the `errors` array the fields take. */
	const errorsOf = (text: string) => (text.trim() ? [text.trim()] : []);

	// Shared prop explanations, so every section words them the same way.
	const ERROR_TEXT = {
		type: 'string',
		label: 'Error message',
		description: 'Shown under the label and read out by screen readers. Clear it to fix the field.'
	} as const;
	const SHAKE = {
		type: 'boolean',
		label: 'Shake',
		description:
			'Shakes once without an error, e.g. when a submit is blocked. Errors shake on their own.'
	} as const;
	const WITH_BORDER = {
		type: 'boolean',
		label: 'With border',
		description:
			'Off hides the resting outline but keeps its space, for fields inside a bordered panel. Focus and errors still draw it.'
	} as const;
	const DISABLED = { type: 'boolean', label: 'Disabled' } as const;
	const REQUIRED = { type: 'boolean', label: 'Required' } as const;

	const toc = [
		{
			group: 'Text entry',
			id: 'text-entry',
			items: [
				{ name: 'KleriInput', id: 'kleri-input' },
				{ name: 'KleriTextarea', id: 'kleri-textarea' }
			]
		},
		{
			group: 'Choice',
			id: 'choice',
			items: [
				{ name: 'KleriSelect', id: 'kleri-select' },
				{ name: 'KleriCombobox', id: 'kleri-combobox' }
			]
		},
		{
			group: 'Toggles',
			id: 'toggles',
			items: [
				{ name: 'KleriSwitch', id: 'kleri-switch' },
				{ name: 'KleriToggleGroup', id: 'kleri-toggle-group' }
			]
		},
		{ group: 'Range', id: 'range', items: [{ name: 'KleriSlider', id: 'kleri-slider' }] },
		{ group: 'Files', id: 'files', items: [{ name: 'KleriDragNDrop', id: 'kleri-drag-n-drop' }] }
	];

	// ---------------------------------------------------------------- KleriInput
	let inputProps = $state({
		value: '',
		label: 'Client name',
		placeholder: 'e.g. Meera Iyer',
		type: 'text',
		required: false,
		disabled: false,
		withBorder: true,
		errorText: '',
		shake: false
	});
	const inputSchema: PropSchema = {
		label: { type: 'string', label: 'Label' },
		placeholder: { type: 'string', label: 'Placeholder' },
		type: { type: 'choice', label: 'Type', options: ['text', 'email', 'password', 'number'] },
		required: REQUIRED,
		disabled: DISABLED,
		withBorder: WITH_BORDER,
		errorText: ERROR_TEXT,
		shake: SHAKE
	};

	// ------------------------------------------------------------- KleriTextarea
	let textareaProps = $state({
		value: '',
		label: 'Matter notes',
		placeholder: 'Hearing outcome, next steps, documents still due from the client…',
		rows: 4,
		resize: 'none' as 'none' | 'y' | 'x' | 'both',
		required: false,
		disabled: false,
		withBorder: true,
		errorText: '',
		shake: false
	});
	const textareaSchema: PropSchema = {
		label: { type: 'string', label: 'Label' },
		placeholder: { type: 'string', label: 'Placeholder' },
		rows: { type: 'number', label: 'Rows' },
		resize: { type: 'choice', label: 'Resize', options: ['none', 'y', 'x', 'both'] },
		required: REQUIRED,
		disabled: DISABLED,
		withBorder: WITH_BORDER,
		errorText: ERROR_TEXT,
		shake: SHAKE
	};

	// --------------------------------------------------------------- KleriSelect
	const courtOptions = [
		{ value: 'sc', label: 'Supreme Court of India', icon: Landmark },
		{ value: 'bom-hc', label: 'Bombay High Court', icon: Landmark },
		{ value: 'del-hc', label: 'Delhi High Court', icon: Landmark },
		{ value: 'pune-dc', label: 'District Court, Pune', icon: Scale },
		{ value: 'nclt-mum', label: 'NCLT, Mumbai Bench', icon: Scale }
	];
	const courtSymbols = new Map<unknown, string>([
		[Landmark, 'Landmark'],
		[Scale, 'Scale']
	]);
	let selectProps = $state({
		value: '',
		label: 'Court',
		placeholder: 'Choose a court',
		required: false,
		disabled: false,
		withBorder: true,
		errorText: '',
		shake: false
	});
	const selectSchema: PropSchema = {
		label: { type: 'string', label: 'Label' },
		placeholder: { type: 'string', label: 'Placeholder' },
		required: REQUIRED,
		disabled: DISABLED,
		withBorder: WITH_BORDER,
		errorText: ERROR_TEXT,
		shake: SHAKE
	};

	// ------------------------------------------------------------- KleriCombobox
	const clientOptions = [
		{ value: 'iyer', label: 'Meera Iyer', description: 'Individual · 2 open matters' },
		{
			value: 'coastal',
			label: 'Coastal Builders Pvt. Ltd.',
			description: 'Company · 5 open matters'
		},
		{ value: 'rao-trust', label: 'Rao Family Trust', description: 'Trust · 1 open matter' },
		{ value: 'deccan', label: 'Deccan Agro Exports LLP', description: 'LLP · 3 open matters' },
		{ value: 'menon', label: 'Arvind Menon', description: 'Individual · no open matters' }
	];
	let comboboxProps = $state({
		value: '',
		label: 'Client',
		placeholder: 'Search clients…',
		emptyText: 'No client by that name. Check the spelling, or add them as a new client.',
		required: false,
		disabled: false,
		allowDeselect: false,
		withBorder: true,
		errorText: '',
		shake: false
	});
	const comboboxSchema: PropSchema = {
		label: { type: 'string', label: 'Label' },
		placeholder: { type: 'string', label: 'Placeholder' },
		emptyText: {
			type: 'string',
			label: 'Empty text',
			description: 'Shown when the search matches nothing.'
		},
		required: REQUIRED,
		disabled: DISABLED,
		allowDeselect: {
			type: 'boolean',
			label: 'Allow deselect',
			description: 'Picking the selected client again clears the field.'
		},
		withBorder: WITH_BORDER,
		errorText: ERROR_TEXT,
		shake: SHAKE
	};

	// --------------------------------------------------------------- KleriSwitch
	let switchProps = $state({
		value: false,
		label: 'Email me the cause list each morning',
		disabled: false,
		errorText: '',
		shake: false
	});
	const switchSchema: PropSchema = {
		value: { type: 'boolean', label: 'Checked' },
		label: { type: 'string', label: 'Label' },
		disabled: DISABLED,
		errorText: ERROR_TEXT,
		shake: SHAKE
	};

	// ---------------------------------------------------------- KleriToggleGroup
	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'on-hold', label: 'On hold' },
		{ value: 'closed', label: 'Closed' }
	];
	let toggleGroupProps = $state({
		value: 'open',
		variant: 'default',
		size: 'default',
		orientation: 'horizontal',
		disabled: false,
		activeClass: kleriToggleActiveClass
	});
	const toggleGroupSchema: PropSchema = {
		variant: { type: 'choice', label: 'Variant', options: ['default', 'outline', 'ghost'] },
		size: { type: 'choice', label: 'Size', options: ['sm', 'default', 'lg'] },
		orientation: { type: 'choice', label: 'Orientation', options: ['horizontal', 'vertical'] },
		disabled: DISABLED,
		activeClass: {
			type: 'string',
			label: 'Active class',
			description: 'Tailwind classes for the pressed item. The default is the brand gradient.'
		}
	};

	// --------------------------------------------------------------- KleriSlider
	const formatDays = (v: number) => `${v} ${v === 1 ? 'day' : 'days'}`;
	const sliderSymbols = new Map<unknown, string>([
		[formatDays, "(v) => `${v} ${v === 1 ? 'day' : 'days'}`"]
	]);
	let sliderProps = $state({
		label: 'Remind me before a hearing',
		type: 'single' as 'single' | 'multiple',
		showValue: true,
		min: 1,
		max: 14,
		step: 1,
		disabled: false,
		errorText: '',
		shake: false
	});
	const sliderSchema: PropSchema = {
		label: { type: 'string', label: 'Label' },
		type: {
			type: 'choice',
			label: 'Type',
			options: ['single', 'multiple'],
			description: 'Multiple adds a second thumb to pick a range.'
		},
		showValue: { type: 'boolean', label: 'Show value' },
		min: { type: 'number', label: 'Min' },
		max: { type: 'number', label: 'Max' },
		step: { type: 'number', label: 'Step' },
		disabled: DISABLED,
		errorText: ERROR_TEXT,
		shake: SHAKE
	};
	// A single slider and a range keep their own values, so flipping `type`
	// never hands the slider the wrong kind and each remembers its position.
	let sliderSingle = $state(3);
	let sliderRange = $state([4, 9]);
	let sliderValue = $derived(sliderProps.type === 'multiple' ? sliderRange : sliderSingle);
	function setSliderValue(next: number | number[]) {
		if (Array.isArray(next)) sliderRange = next;
		else sliderSingle = next;
	}

	// ------------------------------------------------------------ KleriDragNDrop
	let dragndropProps = $state({
		accept: 'pdf, image',
		label: 'Vakalatnama and annexures',
		mainText: 'Drop files here or click to browse',
		subText: '',
		multiple: true,
		disabled: false,
		errorText: ''
	});
	const dragndropSchema: PropSchema = {
		label: { type: 'string', label: 'Label' },
		accept: {
			type: 'string',
			label: 'Allowed types',
			description: 'Comma-separated: image, pdf, ics. Leave empty to accept any file.'
		},
		mainText: { type: 'string', label: 'Main text' },
		subText: {
			type: 'string',
			label: 'Sub text',
			description: 'Leave empty to list the allowed types automatically.'
		},
		multiple: {
			type: 'boolean',
			label: 'Multiple',
			description: 'Off keeps one file: a new drop replaces it.'
		},
		disabled: DISABLED,
		errorText: ERROR_TEXT
	};
	let allowedTypes = $derived(
		dragndropProps.accept
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean) as FileTypeName[]
	);

	const dragndropSymbols = new Map<unknown, string>([[onDrop, '(files) => console.log(files)']]);

	type FileResult = { name: string; accepted: boolean };
	let fileResults = $state<FileResult[]>([]);

	function onDrop(files: File[]) {
		const rejected = fileResults.filter((f) => !f.accepted);
		fileResults = [...files.map((f) => ({ name: f.name, accepted: true })), ...rejected];
	}

	function onRejected(rejected: Array<{ file: File; reason: string }>) {
		const accepted = fileResults.filter((f) => f.accepted);
		fileResults = [...accepted, ...rejected.map((r) => ({ name: r.file.name, accepted: false }))];
	}
</script>

<div class="space-y-16">
	<!-- Page header -->
	<header class="space-y-3">
		<nav aria-label="Breadcrumb" class="font-spacemono text-sm text-muted-foreground">
			<ol class="flex flex-wrap items-center gap-2">
				<li><a href="/" class="transition-colors hover:text-brand">Kleri UI</a></li>
				<li aria-hidden="true">/</li>
				<li><a href="/components" class="transition-colors hover:text-brand">Components</a></li>
				<li aria-hidden="true">/</li>
				<li><span aria-current="page" class="text-foreground">Input</span></li>
			</ol>
		</nav>
		<PrimaryHeading>Input</PrimaryHeading>
		<p class="max-w-prose text-lg text-muted-foreground">
			The fields a Kleri app uses to take in a matter: text, choices, toggles, ranges and files.
			They share one label, error and focus treatment, so a form reads the same wherever it appears.
		</p>

		<nav
			aria-labelledby="input-toc-title"
			class="mt-8 rounded-kleri border border-border/50 bg-card/30 p-5"
		>
			<h2
				id="input-toc-title"
				class="mb-4 font-spacemono text-xs font-semibold tracking-wider text-muted-foreground uppercase"
			>
				On this page
			</h2>
			<ul class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
				{#each toc as entry (entry.id)}
					<li class="space-y-1.5">
						<a
							href="#{entry.id}"
							class="text-sm font-semibold text-foreground transition-colors hover:text-brand"
						>
							{entry.group}
						</a>
						<ul class="space-y-1 border-s-2 border-border/30 ps-3">
							{#each entry.items as item (item.id)}
								<li>
									<a
										href="#{item.id}"
										class="font-spacemono text-xs text-muted-foreground transition-colors hover:text-brand"
									>
										{item.name}
									</a>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		</nav>
	</header>

	<!-- ============================================================ Text entry -->
	<section id="text-entry" aria-labelledby="text-entry-title" class="scroll-mt-8 space-y-12">
		{@render groupHeading('text-entry-title', 'Text entry', 'Typed answers, one line or many.')}

		<DemoSection
			id="kleri-input"
			title="KleriInput"
			description="Single-line text, from a client's name to a CNR number. Password fields get a show and hide button."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					<KleriInput label="Opposing counsel" placeholder="e.g. Adv. R. Kulkarni" />
				</StateTile>
				<StateTile caption="Focus" focus>
					<KleriInput label="Matter title" value="Iyer v. Coastal Builders" />
				</StateTile>
				<StateTile caption="Error">
					<KleriInput
						label="Bar Council enrolment no."
						value="MAH/1234"
						errors={['Add the year, e.g. MAH/1234/2019, as on the enrolment certificate.']}
					/>
				</StateTile>
				<StateTile caption="Disabled">
					<KleriInput label="Matter ID" value="KLR-2026-0187" disabled />
				</StateTile>
				<StateTile caption="With icon">
					<KleriInput label="Courtroom" value="Court Room 14" InputIcon={Landmark} />
				</StateTile>
				<StateTile caption="Password">
					<KleriInput label="e-Courts portal password" type="password" value="hearing-day" />
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<div class="w-full max-w-sm">
					<KleriInput
						bind:value={inputProps.value}
						label={inputProps.label}
						placeholder={inputProps.placeholder}
						type={inputProps.type}
						required={inputProps.required}
						disabled={inputProps.disabled}
						withBorder={inputProps.withBorder}
						errors={errorsOf(inputProps.errorText)}
						shake={inputProps.shake}
					/>
				</div>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={inputSchema} bind:values={inputProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriInput"
					props={{
						value: inputProps.value,
						label: inputProps.label,
						placeholder: inputProps.placeholder,
						type: inputProps.type,
						required: inputProps.required,
						disabled: inputProps.disabled,
						withBorder: inputProps.withBorder,
						errors: errorsOf(inputProps.errorText),
						shake: inputProps.shake
					}}
					bindings={['value']}
					defaults={FIELD_DEFAULTS}
				/>
			{/snippet}
		</DemoSection>

		<DemoSection
			id="kleri-textarea"
			title="KleriTextarea"
			description="Free text that runs past one line: case notes, client instructions, a hearing summary."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					<KleriTextarea
						label="Client instructions"
						placeholder="What the client wants done"
						rows={2}
					/>
				</StateTile>
				<StateTile caption="Focus" focus>
					<KleriTextarea
						label="Next steps"
						rows={2}
						value="File the rejoinder before the next date."
					/>
				</StateTile>
				<StateTile caption="Error">
					<KleriTextarea
						label="Hearing summary"
						rows={2}
						errors={['Write a summary before sending the client update.']}
					/>
				</StateTile>
				<StateTile caption="Disabled">
					<KleriTextarea
						label="Order excerpt"
						rows={2}
						value="Matter adjourned to 14 November."
						disabled
					/>
				</StateTile>
				<StateTile caption="With icon">
					<KleriTextarea
						label="File note"
						rows={2}
						value="Called the client about the stamp duty."
						InputIcon={NotebookPen}
					/>
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<div class="w-full max-w-sm">
					<KleriTextarea
						bind:value={textareaProps.value}
						label={textareaProps.label}
						placeholder={textareaProps.placeholder}
						rows={textareaProps.rows}
						resize={textareaProps.resize}
						required={textareaProps.required}
						disabled={textareaProps.disabled}
						withBorder={textareaProps.withBorder}
						errors={errorsOf(textareaProps.errorText)}
						shake={textareaProps.shake}
					/>
				</div>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={textareaSchema} bind:values={textareaProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriTextarea"
					props={{
						value: textareaProps.value,
						label: textareaProps.label,
						placeholder: textareaProps.placeholder,
						rows: textareaProps.rows,
						resize: textareaProps.resize,
						required: textareaProps.required,
						disabled: textareaProps.disabled,
						withBorder: textareaProps.withBorder,
						errors: errorsOf(textareaProps.errorText),
						shake: textareaProps.shake
					}}
					bindings={['value']}
					defaults={{ ...FIELD_DEFAULTS, rows: 4, resize: 'none' }}
				/>
			{/snippet}
		</DemoSection>
	</section>

	<!-- ================================================================ Choice -->
	<section id="choice" aria-labelledby="choice-title" class="scroll-mt-8 space-y-12">
		{@render groupHeading('choice-title', 'Choice', 'Pick from a list the app already knows.')}

		<DemoSection
			id="kleri-select"
			title="KleriSelect"
			description="Pick one from a short, fixed list, such as the court a matter is filed in. Options can carry an icon or an avatar."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					<KleriSelect label="Forum" placeholder="Choose a court" items={courtOptions} />
				</StateTile>
				<StateTile caption="Focus" focus>
					<KleriSelect label="Appeal to" value="sc" items={courtOptions} />
				</StateTile>
				<StateTile caption="Error">
					<KleriSelect
						label="Filed in"
						placeholder="Choose a court"
						items={courtOptions}
						errors={['Choose the court this matter is filed in.']}
					/>
				</StateTile>
				<StateTile caption="Disabled">
					<KleriSelect label="Trial court" value="pune-dc" items={courtOptions} disabled />
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<div class="w-full max-w-sm">
					<KleriSelect
						items={courtOptions}
						bind:value={selectProps.value}
						label={selectProps.label}
						placeholder={selectProps.placeholder}
						required={selectProps.required}
						disabled={selectProps.disabled}
						withBorder={selectProps.withBorder}
						errors={errorsOf(selectProps.errorText)}
						shake={selectProps.shake}
					/>
				</div>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={selectSchema} bind:values={selectProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriSelect"
					props={{
						value: selectProps.value,
						items: courtOptions,
						label: selectProps.label,
						placeholder: selectProps.placeholder,
						required: selectProps.required,
						disabled: selectProps.disabled,
						withBorder: selectProps.withBorder,
						errors: errorsOf(selectProps.errorText),
						shake: selectProps.shake
					}}
					bindings={['value']}
					defaults={{ ...FIELD_DEFAULTS, placeholder: 'Select an option' }}
					symbols={courtSymbols}
					imports={["import { Landmark, Scale } from '@lucide/svelte';"]}
				/>
			{/snippet}
		</DemoSection>

		<DemoSection
			id="kleri-combobox"
			title="KleriCombobox"
			description="Search a long list as you type, like the firm's client roster. Each option can carry a second line of detail."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					<KleriCombobox label="Client" placeholder="Search clients…" items={clientOptions} />
				</StateTile>
				<StateTile caption="Focus" focus>
					<KleriCombobox label="Billed to" value="coastal" items={clientOptions} />
				</StateTile>
				<StateTile caption="Error">
					<KleriCombobox
						label="Client"
						placeholder="Search clients…"
						items={clientOptions}
						errors={['Pick a client from the list, or add them as a new client first.']}
					/>
				</StateTile>
				<StateTile caption="Disabled">
					<KleriCombobox label="Referred by" value="iyer" items={clientOptions} disabled />
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<div class="w-full max-w-sm">
					<KleriCombobox
						items={clientOptions}
						bind:value={comboboxProps.value}
						label={comboboxProps.label}
						placeholder={comboboxProps.placeholder}
						emptyText={comboboxProps.emptyText}
						required={comboboxProps.required}
						disabled={comboboxProps.disabled}
						allowDeselect={comboboxProps.allowDeselect}
						withBorder={comboboxProps.withBorder}
						errors={errorsOf(comboboxProps.errorText)}
						shake={comboboxProps.shake}
					/>
				</div>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={comboboxSchema} bind:values={comboboxProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriCombobox"
					props={{
						value: comboboxProps.value,
						items: clientOptions,
						label: comboboxProps.label,
						placeholder: comboboxProps.placeholder,
						emptyText: comboboxProps.emptyText,
						required: comboboxProps.required,
						disabled: comboboxProps.disabled,
						allowDeselect: comboboxProps.allowDeselect,
						withBorder: comboboxProps.withBorder,
						errors: errorsOf(comboboxProps.errorText),
						shake: comboboxProps.shake
					}}
					bindings={['value']}
					defaults={{
						...FIELD_DEFAULTS,
						placeholder: 'Search options…',
						emptyText: 'No matching options.',
						allowDeselect: false
					}}
				/>
			{/snippet}
		</DemoSection>
	</section>

	<!-- =============================================================== Toggles -->
	<section id="toggles" aria-labelledby="toggles-title" class="scroll-mt-8 space-y-12">
		{@render groupHeading(
			'toggles-title',
			'Toggles',
			'Settings and modes that apply the moment they change.'
		)}

		<DemoSection
			id="kleri-switch"
			title="KleriSwitch"
			description="An on or off setting that takes effect straight away, with no save button."
		>
			{#snippet states()}
				<StateTile caption="Off">
					<KleriSwitch label="Hearing reminders" />
				</StateTile>
				<StateTile caption="On">
					<KleriSwitch label="Share matter with team" value />
				</StateTile>
				<StateTile caption="Focus" focus>
					<KleriSwitch label="Weekly billing digest" value />
				</StateTile>
				<StateTile caption="Error">
					<KleriSwitch
						label="I accept the engagement terms"
						errors={['Accept the engagement terms to open the matter.']}
					/>
				</StateTile>
				<StateTile caption="Disabled">
					<KleriSwitch label="Court holiday sync" value disabled />
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<KleriSwitch
					bind:value={switchProps.value}
					label={switchProps.label}
					ariaLabel={switchProps.label ? undefined : 'Cause list emails'}
					disabled={switchProps.disabled}
					errors={errorsOf(switchProps.errorText)}
					shake={switchProps.shake}
				/>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={switchSchema} bind:values={switchProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriSwitch"
					props={{
						value: switchProps.value,
						label: switchProps.label || undefined,
						ariaLabel: switchProps.label ? undefined : 'Cause list emails',
						disabled: switchProps.disabled,
						errors: errorsOf(switchProps.errorText),
						shake: switchProps.shake
					}}
					bindings={['value']}
					defaults={{ disabled: false, errors: [], shake: false }}
				/>
			{/snippet}
		</DemoSection>

		<DemoSection
			id="kleri-toggle-group"
			title="KleriToggleGroup"
			description="A row of buttons for picking one mode or filter, such as which matters to list. Arrow keys move between them."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					{@render statusGroup('open', { label: 'Matter status' })}
				</StateTile>
				<StateTile caption="Focus" focus>
					{@render statusGroup('open', { label: 'Matter status' })}
				</StateTile>
				<StateTile caption="Disabled">
					{@render statusGroup('closed', { label: 'Matter status', disabled: true })}
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<KleriToggleGroup
					type="single"
					aria-label="Matter status"
					bind:value={
						() => toggleGroupProps.value,
						(next: string) => {
							// Pressing the active item again would clear it; a filter keeps one.
							if (next) toggleGroupProps.value = next;
						}
					}
					variant={toggleGroupProps.variant as 'default' | 'outline' | 'ghost'}
					size={toggleGroupProps.size as 'sm' | 'default' | 'lg'}
					orientation={toggleGroupProps.orientation as 'horizontal' | 'vertical'}
					disabled={toggleGroupProps.disabled}
					activeClass={toggleGroupProps.activeClass}
				>
					{#each statusOptions as option (option.value)}
						<KleriToggleGroupItem value={option.value}>{option.label}</KleriToggleGroupItem>
					{/each}
				</KleriToggleGroup>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={toggleGroupSchema} bind:values={toggleGroupProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriToggleGroup"
					importNames={['KleriToggleGroupItem']}
					props={{
						value: toggleGroupProps.value,
						type: 'single',
						'aria-label': 'Matter status',
						variant: toggleGroupProps.variant,
						size: toggleGroupProps.size,
						orientation: toggleGroupProps.orientation,
						disabled: toggleGroupProps.disabled,
						activeClass: toggleGroupProps.activeClass,
						children: statusOptions
							.map(
								(o) => `<KleriToggleGroupItem value="${o.value}">${o.label}</KleriToggleGroupItem>`
							)
							.join('\n')
					}}
					bindings={['value']}
					defaults={{
						variant: 'default',
						size: 'default',
						orientation: 'horizontal',
						disabled: false,
						activeClass: kleriToggleActiveClass
					}}
				/>
			{/snippet}
		</DemoSection>
	</section>

	<!-- ================================================================= Range -->
	<section id="range" aria-labelledby="range-title" class="scroll-mt-8 space-y-12">
		{@render groupHeading(
			'range-title',
			'Range',
			'A number, or a span between two, along a scale.'
		)}

		<DemoSection
			id="kleri-slider"
			title="KleriSlider"
			description="Drag or use the arrow keys to set a number, or a range with two thumbs. Screen readers hear the formatted value."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					<KleriSlider label="Reminder lead time" value={3} min={1} max={14} />
				</StateTile>
				<StateTile caption="Focus" focus>
					<KleriSlider label="Adjournment buffer" value={7} min={1} max={14} />
				</StateTile>
				<StateTile caption="Error">
					<KleriSlider
						label="Notice period"
						value={1}
						min={1}
						max={14}
						showValue
						valueFormatter={formatDays}
						errors={['Give the client at least 2 days’ notice.']}
					/>
				</StateTile>
				<StateTile caption="Disabled">
					<KleriSlider label="Limitation buffer" value={10} min={1} max={14} disabled />
				</StateTile>
				<StateTile caption="Range">
					<KleriSlider
						label="Hearing window"
						type="multiple"
						value={[4, 9]}
						min={1}
						max={14}
						showValue
						valueFormatter={formatDays}
					/>
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<div class="w-full max-w-sm">
					{#key sliderProps.type}
						<KleriSlider
							type={sliderProps.type}
							bind:value={() => sliderValue, setSliderValue}
							label={sliderProps.label}
							showValue={sliderProps.showValue}
							min={sliderProps.min}
							max={sliderProps.max}
							step={sliderProps.step}
							disabled={sliderProps.disabled}
							errors={errorsOf(sliderProps.errorText)}
							shake={sliderProps.shake}
							valueFormatter={formatDays}
						/>
					{/key}
				</div>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={sliderSchema} bind:values={sliderProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriSlider"
					props={{
						value: sliderValue,
						type: sliderProps.type,
						label: sliderProps.label,
						showValue: sliderProps.showValue,
						min: sliderProps.min,
						max: sliderProps.max,
						step: sliderProps.step,
						disabled: sliderProps.disabled,
						errors: errorsOf(sliderProps.errorText),
						shake: sliderProps.shake,
						valueFormatter: formatDays
					}}
					bindings={['value']}
					symbols={sliderSymbols}
					defaults={{
						type: 'single',
						showValue: false,
						min: 0,
						max: 100,
						step: 1,
						disabled: false,
						errors: [],
						shake: false
					}}
				/>
			{/snippet}
		</DemoSection>
	</section>

	<!-- ================================================================= Files -->
	<section id="files" aria-labelledby="files-title" class="scroll-mt-8 space-y-12">
		{@render groupHeading(
			'files-title',
			'Files',
			'Documents and images, dropped in or picked from disk.'
		)}

		<DemoSection
			id="kleri-drag-n-drop"
			title="KleriDragNDrop"
			description="Drop files or click to browse. It checks each file's type as it arrives and previews the latest image. A Tauri version takes native file paths."
		>
			{#snippet states()}
				<StateTile caption="Rest">
					<div class="w-full">
						<KleriDragNDrop class="min-h-32" label="Signed vakalatnama" allowedTypes={['pdf']} />
					</div>
				</StateTile>
				<StateTile caption="Error">
					<div class="w-full">
						<KleriDragNDrop
							class="min-h-32"
							label="Certified copy of the order"
							allowedTypes={['pdf']}
							errors={['Attach the certified copy before filing the appeal.']}
						/>
					</div>
				</StateTile>
				<StateTile caption="Disabled">
					<div class="w-full">
						<KleriDragNDrop
							class="min-h-32"
							label="Filed documents"
							allowedTypes={['pdf']}
							disabled
						/>
					</div>
				</StateTile>
			{/snippet}
			{#snippet stage()}
				<div class="flex w-full max-w-sm flex-col gap-4">
					<div>
						<KleriDragNDrop
							allowedTypes={allowedTypes.length > 0 ? allowedTypes : undefined}
							label={dragndropProps.label}
							mainText={dragndropProps.mainText}
							subText={dragndropProps.subText || undefined}
							multiple={dragndropProps.multiple}
							disabled={dragndropProps.disabled}
							errors={errorsOf(dragndropProps.errorText)}
							{onDrop}
							{onRejected}
						/>
					</div>
					<div class="space-y-2" aria-live="polite">
						<p class="ps-2 font-spacemono text-xs text-muted-foreground">
							{fileResults.length === 0 ? 'No files added yet.' : 'Last drop'}
						</p>
						{#if fileResults.length > 0}
							<ul class="flex flex-wrap gap-2">
								{#each fileResults as file (file.name + file.accepted)}
									<li
										class={[
											'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-spacemono text-xs',
											file.accepted
												? 'border-brand/60 text-foreground'
												: 'border-destructive/70 text-destructive'
										]}
									>
										{#if file.accepted}
											<Check class="size-3.5 shrink-0 text-brand" aria-hidden="true" />
										{:else}
											<X class="size-3.5 shrink-0" aria-hidden="true" />
										{/if}
										<span class="truncate">{file.name}</span>
										<span class="sr-only"
											>{file.accepted ? 'added' : 'rejected, wrong file type'}</span
										>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{/snippet}
			{#snippet controls()}
				<PropControls schema={dragndropSchema} bind:values={dragndropProps} />
			{/snippet}
			{#snippet code()}
				<CodePreview
					component="KleriDragNDrop"
					props={{
						allowedTypes: allowedTypes.length > 0 ? allowedTypes : undefined,
						label: dragndropProps.label,
						mainText: dragndropProps.mainText,
						subText: dragndropProps.subText || undefined,
						multiple: dragndropProps.multiple,
						disabled: dragndropProps.disabled,
						errors: errorsOf(dragndropProps.errorText),
						onDrop
					}}
					defaults={{
						mainText: 'Drop files here or click to browse',
						multiple: true,
						disabled: false,
						errors: []
					}}
					symbols={dragndropSymbols}
				/>
			{/snippet}
		</DemoSection>
	</section>
</div>

{#snippet groupHeading(id: string, title: string, lede: string)}
	<div class="flex flex-col gap-1 border-b-2 border-border/30 pb-3">
		<h2 {id} class="font-spacemono text-xl font-bold text-brand">{title}</h2>
		<p class="text-sm text-muted-foreground">{lede}</p>
	</div>
{/snippet}

{#snippet statusGroup(value: string, opts: { label: string; disabled?: boolean })}
	<KleriToggleGroup type="single" {value} aria-label={opts.label} disabled={opts.disabled}>
		{#each statusOptions as option (option.value)}
			<KleriToggleGroupItem value={option.value}>{option.label}</KleriToggleGroupItem>
		{/each}
	</KleriToggleGroup>
{/snippet}
