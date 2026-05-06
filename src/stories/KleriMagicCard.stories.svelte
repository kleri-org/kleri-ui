<script module>
	// @ts-nocheck
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import KleriMagicCard from '$lib/magic/KleriMagicCard.svelte';
	import { KLERI_GREEN_1, KLERI_GREEN_2, KLERI_GREEN_3 } from '$lib/constants';

	const { Story } = defineMeta({
		title: 'Magic/KleriMagicCard',
		component: KleriMagicCard,
		tags: ['autodocs'],
		argTypes: {
			gradientSize: { control: 'number' },
			gradientOpacity: { control: 'number', min: 0, max: 1, step: 0.05 }
		}
	});
</script>

<Story name="Default">
	{#snippet children(args)}
		<div class="flex min-h-[200px] w-full items-center justify-center p-8">
			<KleriMagicCard class="w-full max-w-sm" {...args}>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Magic Card</h3>
					<p class="text-sm text-muted-foreground">
						Move your mouse over this card to see the Kleri Green spotlight effect follow your
						cursor.
					</p>
				</div>
			</KleriMagicCard>
		</div>
	{/snippet}
</Story>

<Story name="Custom Gradient">
	{#snippet children(args)}
		<div class="flex min-h-[200px] w-full items-center justify-center p-8">
			<KleriMagicCard
				class="w-full max-w-sm"
				gradientFrom={KLERI_GREEN_3}
				gradientTo={KLERI_GREEN_2}
				gradientColor={KLERI_GREEN_1}
				{...args}
			>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Custom Gradient</h3>
					<p class="text-sm text-muted-foreground">
						This card uses a reversed Kleri Green gradient direction.
					</p>
				</div>
			</KleriMagicCard>
		</div>
	{/snippet}
</Story>

<Story name="Large Glow">
	{#snippet children(args)}
		<div class="flex min-h-[200px] w-full items-center justify-center p-8">
			<KleriMagicCard class="w-full max-w-sm" gradientSize={300} gradientOpacity={0.3} {...args}>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Large Glow</h3>
					<p class="text-sm text-muted-foreground">
						A larger gradient circle creates a more diffuse spotlight effect.
					</p>
				</div>
			</KleriMagicCard>
		</div>
	{/snippet}
</Story>
