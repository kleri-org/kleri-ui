<script lang="ts">
	interface Props {
		/** Meteors rendered per direction (left-drifting and right-drifting). */
		number?: number;
	}

	interface MeteorStyle {
		top: number;
		left: string;
		animationDelay: string;
		animationDuration: string;
		tailWidth: string;
	}

	let { number = 100 }: Props = $props();

	/**
	 * `spread` is the horizontal range the meteors start within: negative values
	 * send them off to the left, positive to the right.
	 */
	function makeMeteors(count: number, spread: number): MeteorStyle[] {
		return Array.from({ length: Math.max(0, count) }, () => ({
			top: -3,
			left: `${Math.floor(Math.random() * spread)}px`,
			animationDelay: `${Math.random() * 8 + 0.2}s`,
			animationDuration: `${Math.floor(Math.random() * 8 + 2.9)}s`,
			// Random width between 40px and 110px
			tailWidth: `${Math.floor(Math.random() * 70 + 40)}px`
		}));
	}

	// Deliberately `$state` + `$effect` rather than `$derived`: `$derived` is
	// evaluated during SSR, and `Math.random()` cannot agree between the server
	// and client renders. An effect runs after hydration, so the server emits no
	// meteors and the client fills them in. Regenerates when `number` changes.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let meteors = $state<{ left: MeteorStyle[]; right: MeteorStyle[] }>({ left: [], right: [] });

	$effect(() => {
		meteors = { left: makeMeteors(number, -2000), right: makeMeteors(number, 2000) };
	});
</script>

{#snippet meteor(style: MeteorStyle)}
	<span
		data-slot="meteor"
		class="pointer-events-none absolute top-1/2 left-1/2 size-[2.4px] rotate-180 animate-meteor rounded-full bg-slate-500 shadow-[0_0_0_1px_#ffffff10]"
		style="top: {style.top}px; left: {style.left}; animation-delay: {style.animationDelay}; animation-duration: {style.animationDuration};"
	>
		<!-- Meteor Tail -->
		<div
			class="pointer-events-none absolute -z-10 h-px bg-linear-to-r from-kleri-2 via-kleri-1 to-transparent"
			style="width: {style.tailWidth};"
		></div>
	</span>
{/snippet}

{#each meteors.left as style, idx (idx)}
	{@render meteor(style)}
{/each}

{#each meteors.right as style, idx (idx)}
	{@render meteor(style)}
{/each}
