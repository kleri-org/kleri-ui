import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import AnimatedGridPattern from './AnimatedGridPattern.svelte';
import MeteorAnimation from './MeteorAnimation.svelte';

describe('AnimatedGridPattern', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders an aria-hidden svg grid', () => {
		const { container } = render(AnimatedGridPattern, {
			props: { width: 24, height: 32, class: 'grid-test' }
		});

		const svg = container.querySelector('svg[aria-hidden="true"]');
		expect(svg).toBeInTheDocument();
		expect(svg).toHaveClass('grid-test');
		expect(container.querySelector('pattern')).toHaveAttribute('width', '24');
		expect(container.querySelector('pattern')).toHaveAttribute('height', '32');
	});

	it('uses the provided stroke dash array', () => {
		const { container } = render(AnimatedGridPattern, {
			props: { strokeDasharray: 4 }
		});

		expect(container.querySelector('pattern path')).toHaveAttribute('stroke-dasharray', '4');
	});
});

describe('MeteorAnimation', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders the requested number of meteors on each side after mount', async () => {
		const { container } = render(MeteorAnimation, {
			props: { number: 3 }
		});

		await waitFor(() => {
			expect(container.querySelectorAll('span[id^="meteor-"]')).toHaveLength(6);
		});
	});

	it('renders no meteors when number is zero', async () => {
		const { container } = render(MeteorAnimation, {
			props: { number: 0 }
		});

		await waitFor(() => {
			expect(container.querySelectorAll('span[id^="meteor-"]')).toHaveLength(0);
		});
	});
});
