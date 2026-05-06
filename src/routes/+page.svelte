<script lang="ts">
	import { motion } from 'motion-sv';
	import KleriUiLogo from '../assetes/KleriUiLogo.svelte';
	import AnimatedGridPattern from '$lib/animation/AnimatedGridPattern.svelte';
</script>

<!-- Full-page Hero -->
<section class="relative flex h-screen flex-col items-center justify-center overflow-hidden">
	<AnimatedGridPattern
		numSquares={40}
		maxOpacity={0.6}
		duration={3}
		repeatDelay={0.8}
		class="absolute inset-0"
	/>

	<div class="relative z-10 flex flex-col items-center gap-6 text-center">
		<!-- Logo with scale+fade entrance -->
		<motion.div
			initial={{ opacity: 0, scale: 0.85 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.8, ease: 'easeOut' }}
		>
			<span
				class="kleri-text-animation font-spacemono
					   text-xl leading-tight font-extrabold tracking-tight sm:text-3xl md:text-5xl"
				>Kleri
			</span>
			<KleriUiLogo class="h-32 w-auto sm:h-40 md:h-48" />
		</motion.div>

		<!-- Title slides up -->
		<motion.h1
			initial={{ opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
		></motion.h1>

		<!-- Subtitle slides up -->
		<motion.p
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
			class="max-w-lg text-lg text-muted-foreground sm:text-xl"
		>
			A handcrafted component library built with Svelte&nbsp;5 and Tailwind&nbsp;CSS.
		</motion.p>

		<!-- CTA Button slides up -->
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
			class="mt-2"
		>
			<a
				href="/components"
				class="group inline-flex items-center gap-2 rounded-full border-2 border-kleri-green-2/40 bg-kleri-green-3/10 px-6 py-3 text-sm font-medium text-kleri-green-2 transition-all hover:border-kleri-green-2 hover:bg-kleri-green-3/20"
			>
				Explore Components
				<svg
					class="h-4 w-4 transition-transform group-hover:translate-x-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
				</svg>
			</a>
		</motion.div>
	</div>
</section>
