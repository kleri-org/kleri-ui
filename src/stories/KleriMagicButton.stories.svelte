<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import KleriMagicButton from '$lib/magic/KleriMagicButton.svelte';
  import { KLERI_GREEN_1, KLERI_GREEN_2, KLERI_GREEN_3 } from '$lib/constants';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Magic/KleriMagicButton',
    component: KleriMagicButton,
    tags: ['autodocs'],
    argTypes: {
      gradientSize: { control: 'number' },
      gradientOpacity: { control: 'number', min: 0, max: 1, step: 0.05 },
    },
    args: {
      onclick: fn(),
    }
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <div class="flex min-h-[120px] w-full items-center justify-center p-8">
      <KleriMagicButton {...args}>Hover me</KleriMagicButton>
    </div>
  {/snippet}
</Story>

<Story name="Custom Gradient">
  {#snippet children(args)}
    <div class="flex min-h-[120px] w-full items-center justify-center p-8">
      <KleriMagicButton
        gradientFrom={KLERI_GREEN_3}
        gradientTo={KLERI_GREEN_2}
        gradientColor={KLERI_GREEN_1}
        {...args}
      >
        Custom Glow
      </KleriMagicButton>
    </div>
  {/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
  {#snippet children(args)}
    <div class="flex min-h-[120px] w-full items-center justify-center p-8">
      <KleriMagicButton {...args}>Disabled</KleriMagicButton>
    </div>
  {/snippet}
</Story>
