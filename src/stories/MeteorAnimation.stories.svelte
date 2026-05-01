<script module>
  // @ts-nocheck
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MeteorAnimation from '$lib/Meteors.svelte';

  const { Story } = defineMeta({
    title: 'Info/MeteorAnimation',
    component: MeteorAnimation,
    tags: ['autodocs'],
    argTypes: {
      number: { control: { type: 'range', min: 1, max: 200, step: 1 } },
    },
    args: {
      number: 50,
    }
  });
</script>

<Story name="Default" />

<Story name="Few" args={{ number: 10 }} />

<Story name="Many" args={{ number: 100 }} />
