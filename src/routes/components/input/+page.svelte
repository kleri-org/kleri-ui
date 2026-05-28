<script lang="ts">
	import KleriSwitch from '$lib/input/KleriSwitch.svelte';
	import KleriInput from '$lib/input/KleriInput.svelte';
	import KleriSlider from '$lib/input/KleriSlider.svelte';
	import KleriDragNDrop from '$lib/input/dragndrop/KleriDragNDrop.svelte';
	import { KleriToggleGroup, KleriToggleGroupItem } from '$lib/toggle';
	import { PropControls, CodePreview } from '$lib/preview';

	let switchProps = $state({
		value: false,
		disabled: false,
		ariaLabel: 'Toggle switch'
	});
	const switchSchema = {
		value: { type: 'boolean' as const, label: 'Checked' },
		disabled: { type: 'boolean' as const, label: 'Disabled' },
		ariaLabel: { type: 'string' as const, label: 'Aria Label' }
	};

	let inputProps = $state({
		value: '',
		label: 'Email',
		placeholder: 'Enter your email',
		type: 'text',
		required: false,
		withBorder: true,
		shake: false,
		errors: [] as string[]
	});
	const inputSchema = {
		label: { type: 'string' as const, label: 'Label' },
		placeholder: { type: 'string' as const, label: 'Placeholder' },
		type: { type: 'string' as const, label: 'Type' },
		required: { type: 'boolean' as const, label: 'Required' },
		withBorder: { type: 'boolean' as const, label: 'With Border' },
		shake: { type: 'boolean' as const, label: 'Shake' }
	};

	$effect(() => {
		if (inputProps.shake) {
			inputProps.errors = ['Invalid input'];
		} else {
			inputProps.errors = [];
		}
	});

	let dragndropValues = $state({
		accept: 'image,pdf',
		label: 'Drop your files here',
		mainText: 'Drag and Drop Your file here',
		subText: ''
	});
	let dragndropAllowedTypes = $derived(
		dragndropValues.accept
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	);
	let dragndropProps = $derived({
		label: dragndropValues.label,
		mainText: dragndropValues.mainText,
		subText: dragndropValues.subText
	});

	let lastDropped = $state<string[]>([]);
	let lastRejected = $state<string[]>([]);

	function onDrop(files: File[]) {
		lastDropped = files.map((f) => f.name);
		lastRejected = [];
	}

	function onRejected(rejected: Array<{ file: File; reason: string }>) {
		lastRejected = rejected.map((r) => r.file.name);
	}

	const dragndropSchema = {
		accept: { type: 'string' as const, label: 'Allowed Types (comma-separated)' },
		label: { type: 'string' as const, label: 'Label' },
		mainText: { type: 'string' as const, label: 'Main Text' },
		subText: { type: 'string' as const, label: 'Sub Text (leave empty for auto)' }
	};

	let toggleGroupValue = $state('bold');
	let toggleGroupProps = $state({
		variant: 'default',
		size: 'default',
		orientation: 'horizontal'
	});
	const toggleGroupSchema = {
		variant: { type: 'string' as const, label: 'Variant (default | outline | ghost)' },
		size: { type: 'string' as const, label: 'Size (sm | default | lg)' },
		orientation: { type: 'string' as const, label: 'Orientation (horizontal | vertical)' }
	};

	let sliderValue = $state(50);
	let sliderProps = $state({
		label: 'Brightness',
		showValue: true,
		min: 0,
		max: 100,
		step: 1,
		shake: false
	});
	let sliderErrors = $state<string[]>([]);
	const sliderSchema = {
		label: { type: 'string' as const, label: 'Label' },
		showValue: { type: 'boolean' as const, label: 'Show Value' },
		min: { type: 'number' as const, label: 'Min' },
		max: { type: 'number' as const, label: 'Max' },
		step: { type: 'number' as const, label: 'Step' },
		shake: { type: 'boolean' as const, label: 'Shake' }
	};

	$effect(() => {
		if (sliderProps.shake) {
			sliderErrors = ['Invalid value'];
		} else {
			sliderErrors = [];
		}
	});
</script>

<div class="space-y-16">
	<!-- Page header -->
	<div class="space-y-2">
		<div class="mb-2 flex items-center gap-2 font-spacemono text-sm text-muted-foreground">
			<a href="/" class="transition-colors hover:text-kleri-2">Kleri UI</a>
			<span>/</span>
			<a href="/components" class="transition-colors hover:text-kleri-2">Components</a>
			<span>/</span>
			<span class="text-foreground">Input</span>
		</div>
		<h1 class="text-4xl font-bold text-foreground">Input</h1>
		<p class="text-lg text-muted-foreground">
			Form controls, switches, text inputs, and drag-and-drop upload.
		</p>
	</div>

	<!-- KleriSwitch -->
	<section id="kleri-switch" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriSwitch</h2>
			<p class="text-muted-foreground">
				Accessible toggle switch with animated thumb and gradient checked state.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriSwitch
						bind:value={switchProps.value}
						disabled={switchProps.disabled}
						ariaLabel={switchProps.ariaLabel}
					/>
				</div>
				<CodePreview component="KleriSwitch" props={switchProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={switchSchema} bind:values={switchProps} />
			</div>
		</div>
	</section>

	<!-- KleriInput -->
	<section id="kleri-input" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriInput</h2>
			<p class="text-muted-foreground">
				Text input with label, error states, password visibility toggle, and shake animation.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div class="w-full max-w-sm">
						<KleriInput
							bind:value={inputProps.value}
							label={inputProps.label}
							placeholder={inputProps.placeholder}
							type={inputProps.type}
							required={inputProps.required}
							withBorder={inputProps.withBorder}
							bind:errors={inputProps.errors}
						/>
					</div>
				</div>
				<CodePreview component="KleriInput" props={inputProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={inputSchema} bind:values={inputProps} />
			</div>
		</div>
	</section>

	<!-- KleriToggleGroup -->
	<section id="kleri-toggle-group" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriToggleGroup</h2>
			<p class="text-muted-foreground">
				Accessible toggle group with multiple variants, sizes, and orientations. Compose with
				KleriToggleGroupItem for individual toggles.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<KleriToggleGroup
						type="single"
						bind:value={toggleGroupValue}
						variant={toggleGroupProps.variant as 'default' | 'outline' | 'ghost'}
						size={toggleGroupProps.size as 'sm' | 'default' | 'lg'}
						orientation={toggleGroupProps.orientation as 'horizontal' | 'vertical'}
					>
						<KleriToggleGroupItem value="bold">Bold</KleriToggleGroupItem>
						<KleriToggleGroupItem value="italic">Italic</KleriToggleGroupItem>
						<KleriToggleGroupItem value="underline">Underline</KleriToggleGroupItem>
					</KleriToggleGroup>
				</div>
				<CodePreview
					component="KleriToggleGroup"
					props={{ ...toggleGroupProps, value: toggleGroupValue }}
				/>
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={toggleGroupSchema} bind:values={toggleGroupProps} />
			</div>
		</div>
	</section>

	<!-- KleriSlider -->
	<section id="kleri-slider" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriSlider</h2>
			<p class="text-muted-foreground">
				Accessible range slider with gradient track, animated thumb, label, value display, and error
				shake animation.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div class="w-full max-w-sm">
						<KleriSlider
							type="single"
							bind:value={sliderValue}
							label={sliderProps.label}
							showValue={sliderProps.showValue}
							min={sliderProps.min}
							max={sliderProps.max}
							step={sliderProps.step}
							errors={sliderErrors}
							valueFormatter={(v: number) => `${v}%`}
						/>
					</div>
				</div>
				<CodePreview component="KleriSlider" props={{ ...sliderProps, value: sliderValue }} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={sliderSchema} bind:values={sliderProps} />
			</div>
		</div>
	</section>

	<!-- KleriDragNDrop -->
	<section id="kleri-drag-n-drop" class="scroll-mt-8 space-y-6">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold text-foreground">KleriDragNDrop</h2>
			<p class="text-muted-foreground">
				Drag-and-drop file upload dropzone with image preview and click-to-browse support — ideal
				for Tauri desktop apps with native file handling.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div
					class="flex min-h-60 flex-col items-center justify-center rounded-xl border-2 border-border/50 bg-card/30 p-12"
				>
					<div class="h-60 w-60">
						<KleriDragNDrop
							allowedTypes={dragndropValues.accept ? dragndropAllowedTypes : undefined}
							label={dragndropValues.label}
							mainText={dragndropValues.mainText}
							subText={dragndropValues.subText || undefined}
							{onDrop}
							{onRejected}
						/>
					</div>
					<div class="flex flex-row">
						<p class="mt-2 font-spacemono text-xs">File(s) - &nbsp;</p>
						{#if lastDropped.length > 0}
							<p class="mt-2 font-spacemono text-xs text-green-600 dark:text-green-400">
								Accepted: {lastDropped.join(', ')}
							</p>
						{:else if lastRejected.length > 0}
							<p class="mt-2 font-spacemono text-xs text-red-600 dark:text-red-400">
								Rejected: {lastRejected.join(', ')}
							</p>
						{:else}
							<p class="mt-2 font-spacemono text-xs">None</p>
						{/if}
					</div>
				</div>
				<CodePreview component="KleriDragNDrop" props={dragndropProps} />
			</div>
			<div class="h-fit rounded-xl border-2 border-border/50 bg-card/30 p-6">
				<h2
					class="mb-4 font-spacemono text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					Props
				</h2>
				<PropControls schema={dragndropSchema} bind:values={dragndropValues} />
			</div>
		</div>
	</section>
</div>
