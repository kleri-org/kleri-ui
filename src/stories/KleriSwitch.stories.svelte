<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import KleriSwitch from '$lib/input/KleriSwitch.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Input/KleriSwitch',
    component: KleriSwitch,
    tags: ['autodocs'],
    argTypes: {
      checked: { control: 'boolean' },
      disabled: { control: 'boolean' },
      ariaLabel: { control: 'text' },
    },
    args: {
      checked: false,
      disabled: false,
      ariaLabel: 'Toggle switch',
      onChecked: fn(),
    }
  });
</script>

<Story name="Unchecked" />

<Story name="Checked" args={{ checked: true }} />

<Story name="Disabled" args={{ disabled: true }} />

<Story name="Disabled Checked" args={{ disabled: true, checked: true }} />
