<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SubHeading from '$lib/heading/SubHeading.svelte';

  const { Story } = defineMeta({
    title: 'Heading/SubHeading',
    component: SubHeading,
    tags: ['autodocs'],
    argTypes: {
      class: { control: 'text' },
      info: { control: 'text' },
      warning: { control: 'text' },
    },
    args: {
      class: '',
    }
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <SubHeading {...args}>Sub Heading</SubHeading>
  {/snippet}
</Story>

<Story name="With Info" args={{ info: 'This is some additional information' }}>
  {#snippet children(args)}
    <SubHeading {...args}>Sub Heading with Info</SubHeading>
  {/snippet}
</Story>

<Story name="With Warning" args={{ warning: 'This action cannot be undone' }}>
  {#snippet children(args)}
    <SubHeading {...args}>Sub Heading with Warning</SubHeading>
  {/snippet}
</Story>
