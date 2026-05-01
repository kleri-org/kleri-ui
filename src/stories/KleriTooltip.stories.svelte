<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import KleriTooltip from '$lib/tooltip/KleriTooltip.svelte';

  const { Story } = defineMeta({
    title: 'Tooltip/KleriTooltip',
    component: KleriTooltip,
    tags: ['autodocs'],
    argTypes: {
      side: {
        control: { type: 'select' },
        options: ['top', 'right', 'bottom', 'left'],
      },
      sideOffset: { control: 'number' },
      arrow: { control: 'boolean' },
    },
    args: {
      side: 'bottom',
      sideOffset: 5,
      arrow: false,
    }
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <KleriTooltip {...args}>
      {#snippet trigger()}
        <button class="btn rounded-kleri border-2 border-black bg-primary px-4 py-2">Hover me</button>
      {/snippet}
      <p>This is a tooltip</p>
    </KleriTooltip>
  {/snippet}
</Story>

<Story name="With Arrow" args={{ arrow: true }}>
  {#snippet children(args)}
    <KleriTooltip {...args}>
      {#snippet trigger()}
        <button class="btn rounded-kleri border-2 border-black bg-primary px-4 py-2">Hover me</button>
      {/snippet}
      <p>Tooltip with arrow</p>
    </KleriTooltip>
  {/snippet}
</Story>

<Story name="Top" args={{ side: 'top' }}>
  {#snippet children(args)}
    <KleriTooltip {...args}>
      {#snippet trigger()}
        <button class="btn rounded-kleri border-2 border-black bg-primary px-4 py-2">Hover me</button>
      {/snippet}
      <p>Tooltip on top</p>
    </KleriTooltip>
  {/snippet}
</Story>
