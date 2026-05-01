<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SettingsOption from '$lib/input-text/SettingsOption.svelte';
  import KleriSwitch from '$lib/input-text/KleriSwitch.svelte';

  const { Story } = defineMeta({
    title: 'Input/SettingsOption',
    component: SettingsOption,
    tags: ['autodocs'],
    argTypes: {
      optionAtEnd: { control: 'boolean' },
    },
    args: {
      optionAtEnd: false,
    }
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <SettingsOption {...args}>
      {#snippet name()}Dark Mode{/snippet}
      {#snippet option()}<KleriSwitch value={true} />{/snippet}
    </SettingsOption>
  {/snippet}
</Story>

<Story name="Option At End" args={{ optionAtEnd: true }}>
  {#snippet children(args)}
    <SettingsOption {...args}>
      {#snippet name()}Notifications{/snippet}
      {#snippet option()}<KleriSwitch />{/snippet}
    </SettingsOption>
  {/snippet}
</Story>
