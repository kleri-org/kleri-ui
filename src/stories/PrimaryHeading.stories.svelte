<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PrimaryHeading from '$lib/text/PrimaryHeading.svelte';

  const { Story } = defineMeta({
    title: 'Text/PrimaryHeading',
    component: PrimaryHeading,
    tags: ['autodocs'],
    argTypes: {
      class: { control: 'text' },
    },
    args: {
      class: '',
    }
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <PrimaryHeading {...args}>Primary Heading</PrimaryHeading>
  {/snippet}
</Story>
