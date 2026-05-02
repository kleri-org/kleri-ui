<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import KleriMagicCard from '$lib/magic/KleriMagicCard.svelte';

  const { Story } = defineMeta({
    title: 'Magic/KleriMagicCard',
    component: KleriMagicCard,
    tags: ['autodocs'],
    argTypes: {
      gradientSize: { control: 'number' },
      gradientOpacity: { control: 'number', min: 0, max: 1, step: 0.05 },
    },
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <div class="flex min-h-[200px] w-full items-center justify-center p-8">
      <KleriMagicCard class="w-full max-w-sm" {...args}>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Magic Card</h3>
          <p class="text-muted-foreground text-sm">
            Move your mouse over this card to see the Kleri Green spotlight effect follow your cursor.
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
        gradientFrom="rgb(35, 145, 144)"
        gradientTo="rgb(132, 204, 184)"
        gradientColor="rgb(25, 96, 114)"
        {...args}
      >
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Custom Gradient</h3>
          <p class="text-muted-foreground text-sm">
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
          <p class="text-muted-foreground text-sm">
            A larger gradient circle creates a more diffuse spotlight effect.
          </p>
        </div>
      </KleriMagicCard>
    </div>
  {/snippet}
</Story>
