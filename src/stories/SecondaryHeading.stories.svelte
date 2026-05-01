<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SecondaryHeading from '$lib/heading/SecondaryHeading.svelte';

  const { Story } = defineMeta({
    title: 'Heading/SecondaryHeading',
    component: SecondaryHeading,
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
    <SecondaryHeading {...args}>Secondary Heading</SecondaryHeading>
  {/snippet}
</Story>
