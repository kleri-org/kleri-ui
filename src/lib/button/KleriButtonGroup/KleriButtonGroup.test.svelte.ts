import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Circle } from '@lucide/svelte';
import ButtonGroupTestHost from '../../../test/ButtonGroupTestHost.svelte';

describe('KleriButtonGroup', () => {
	afterEach(() => {
		cleanup();
	});

	// ---------------------------------------------------------------------------
	// Rendering & Structure
	// ---------------------------------------------------------------------------
	describe('rendering & structure', () => {
		it('renders with role="group" and data-slot', () => {
			render(ButtonGroupTestHost);
			const group = screen.getByRole('group');
			expect(group).toBeInTheDocument();
			expect(group).toHaveAttribute('data-slot', 'button-group');
			expect(group).toHaveAttribute('data-orientation', 'horizontal');
		});

		it('has w-fit and items-stretch layout classes', () => {
			render(ButtonGroupTestHost);
			const group = screen.getByRole('group');
			expect(group).toHaveClass('w-fit');
			expect(group).toHaveClass('items-stretch');
		});

		it('applies custom className to the group wrapper', () => {
			render(ButtonGroupTestHost, { props: { className: 'my-custom-group' } });
			const group = screen.getByRole('group');
			expect(group).toHaveClass('my-custom-group');
		});

		it('spreads additional HTML attributes onto the wrapper', () => {
			render(ButtonGroupTestHost, { props: { groupId: 'test-group', ariaLabel: 'Toolbar' } });
			const group = screen.getByRole('group');
			expect(group).toHaveAttribute('id', 'test-group');
			expect(group).toHaveAttribute('aria-label', 'Toolbar');
		});
	});

	// ---------------------------------------------------------------------------
	// Orientation
	// ---------------------------------------------------------------------------
	describe('orientation', () => {
		it('applies horizontal orientation classes by default', () => {
			render(ButtonGroupTestHost);
			const group = screen.getByRole('group');
			expect(group).toHaveClass('flex');
			expect(group).not.toHaveClass('flex-col');
			expect(group).toHaveAttribute('data-orientation', 'horizontal');
		});

		it('applies vertical orientation classes when specified', () => {
			render(ButtonGroupTestHost, { props: { orientation: 'vertical' } });
			const group = screen.getByRole('group');
			expect(group).toHaveClass('flex-col');
			expect(group).toHaveAttribute('data-orientation', 'vertical');
		});
	});

	// ---------------------------------------------------------------------------
	// Items — Buttons
	// ---------------------------------------------------------------------------
	describe('button items', () => {
		it('renders buttons with data-slot="button"', () => {
			render(ButtonGroupTestHost);
			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(2);
			buttons.forEach((btn) => {
				expect(btn).toHaveAttribute('data-slot', 'button');
			});
		});

		it('renders button labels', () => {
			render(ButtonGroupTestHost, { props: { buttonLabels: ['Save', 'Delete'] } });
			expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		});

		it('applies flex layout classes to each button', () => {
			render(ButtonGroupTestHost);
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('flex');
				expect(btn).toHaveClass('flex-row');
				expect(btn).toHaveClass('items-center');
				expect(btn).toHaveClass('justify-center');
			});
		});

		it('applies custom class to individual buttons', () => {
			render(ButtonGroupTestHost, {
				props: { buttonClasses: ['btn-save', 'btn-delete'] }
			});
			const buttons = screen.getAllByRole('button');
			expect(buttons[0]).toHaveClass('btn-save');
			expect(buttons[1]).toHaveClass('btn-delete');
		});

		it('passes disabled prop through to buttons', () => {
			render(ButtonGroupTestHost, {
				props: { buttonDisabled: [true, false] }
			});
			const buttons = screen.getAllByRole('button');
			expect(buttons[0]).toBeDisabled();
			expect(buttons[1]).not.toBeDisabled();
		});

		it('passes onclick handler through to buttons', async () => {
			const onClickOne = vi.fn();
			const onClickTwo = vi.fn();
			render(ButtonGroupTestHost, {
				props: {
					buttonLabels: ['One', 'Two'],
					buttonOnclicks: [onClickOne, onClickTwo]
				}
			});
			await fireEvent.click(screen.getByRole('button', { name: 'One' }));
			expect(onClickOne).toHaveBeenCalledOnce();

			await fireEvent.click(screen.getByRole('button', { name: 'Two' }));
			expect(onClickTwo).toHaveBeenCalledOnce();
		});

		it('renders icons alongside labels when provided', () => {
			render(ButtonGroupTestHost, {
				props: {
					buttonLabels: ['One'],
					buttonIcons: [Circle]
				}
			});
			const button = screen.getByRole('button', { name: 'One' });
			// The icon is rendered as an SVG inside the button
			const svg = button.querySelector('svg');
			expect(svg).not.toBeNull();
		});

		it('does not render an icon when not provided', () => {
			render(ButtonGroupTestHost, {
				props: { buttonLabels: ['Plain'] }
			});
			const button = screen.getByRole('button', { name: 'Plain' });
			const svg = button.querySelector('svg');
			expect(svg).toBeNull();
		});

		it('renders buttons without onclick when no handler provided', () => {
			render(ButtonGroupTestHost, {
				props: { buttonLabels: ['Noop'] }
			});
			const button = screen.getByRole('button', { name: 'Noop' });
			expect(button).toBeInTheDocument();
			// Clicking should not throw
			expect(() => fireEvent.click(button)).not.toThrow();
		});
	});

	// ---------------------------------------------------------------------------
	// Items — Separators
	// ---------------------------------------------------------------------------
	describe('separator items', () => {
		it('renders a separator with correct attributes', () => {
			render(ButtonGroupTestHost, { props: { includeSeparator: true } });
			const separator = screen.getByRole('separator');
			expect(separator).toBeInTheDocument();
			expect(separator).toHaveAttribute('data-slot', 'button-group-separator');
		});

		it('renders multiple separators', () => {
			render(ButtonGroupTestHost, {
				props: { separatorCount: 3, buttonLabels: [] }
			});
			const separators = screen.getAllByRole('separator');
			expect(separators).toHaveLength(3);
		});

		it('horizontal separator has mx-3 and w-px classes', () => {
			render(ButtonGroupTestHost, {
				props: { includeSeparator: true, orientation: 'horizontal' }
			});
			const separator = screen.getByRole('separator');
			expect(separator).toHaveClass('mx-3');
			expect(separator).toHaveClass('w-px');
		});

		it('vertical separator has my-3 and h-px classes', () => {
			render(ButtonGroupTestHost, {
				props: { includeSeparator: true, orientation: 'vertical' }
			});
			const separator = screen.getByRole('separator');
			expect(separator).toHaveClass('my-3');
			expect(separator).toHaveClass('h-px');
		});

		it('separator aria-orientation matches group orientation', () => {
			render(ButtonGroupTestHost, {
				props: { includeSeparator: true, orientation: 'vertical' }
			});
			const separator = screen.getByRole('separator');
			expect(separator).toHaveAttribute('aria-orientation', 'vertical');
		});

		it('horizontal separator has aria-orientation="horizontal"', () => {
			render(ButtonGroupTestHost, {
				props: { includeSeparator: true, orientation: 'horizontal' }
			});
			const separator = screen.getByRole('separator');
			expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
		});
	});

	// ---------------------------------------------------------------------------
	// Items — Text
	// ---------------------------------------------------------------------------
	describe('text items', () => {
		it('renders text content', () => {
			render(ButtonGroupTestHost, {
				props: { includeText: true, textContent: 'Hello World' }
			});
			expect(screen.getByText('Hello World')).toBeInTheDocument();
		});

		it('text item has data-slot="button-group-text"', () => {
			render(ButtonGroupTestHost, { props: { includeText: true } });
			const textEl = screen.getByText('https://');
			expect(textEl).toHaveAttribute('data-slot', 'button-group-text');
		});

		it('renders default text content', () => {
			render(ButtonGroupTestHost, { props: { includeText: true } });
			expect(screen.getByText('https://')).toBeInTheDocument();
		});
	});

	// ---------------------------------------------------------------------------
	// Context Propagation — Size
	// ---------------------------------------------------------------------------
	describe('size propagation', () => {
		it('propagates size "sm" to child utility buttons', () => {
			render(ButtonGroupTestHost, { props: { size: 'sm' } });
			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(2);
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('text-sm');
				expect(btn).toHaveClass('px-3');
				expect(btn).toHaveClass('py-2');
			});
		});

		it('propagates size "lg" to child utility buttons', () => {
			render(ButtonGroupTestHost, { props: { size: 'lg' } });
			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(2);
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('text-base');
				expect(btn).toHaveClass('px-4');
				expect(btn).toHaveClass('py-2');
			});
		});

		it('defaults to size "sm" when no size is specified', () => {
			render(ButtonGroupTestHost, { props: { size: undefined } });
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('text-sm');
			});
		});
	});

	// ---------------------------------------------------------------------------
	// Context Propagation — Variant
	// ---------------------------------------------------------------------------
	describe('variant propagation', () => {
		it('propagates variant "default" to child utility buttons', () => {
			render(ButtonGroupTestHost, { props: { variant: 'default' } });
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('bg-none');
				expect(btn).toHaveClass('text-white');
			});
		});

		it('propagates variant "outline" to child utility buttons', () => {
			render(ButtonGroupTestHost, { props: { variant: 'outline' } });
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('bg-transparent');
				expect(btn).toHaveClass('border-border');
				expect(btn).toHaveClass('text-foreground');
			});
		});

		it('propagates variant "ghost" to child utility buttons', () => {
			render(ButtonGroupTestHost, { props: { variant: 'ghost' } });
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('bg-transparent');
				expect(btn).toHaveClass('border-transparent');
				expect(btn).toHaveClass('text-foreground');
			});
		});

		it('propagates variant "secondary" to child utility buttons', () => {
			render(ButtonGroupTestHost, { props: { variant: 'secondary' } });
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('bg-secondary');
				expect(btn).toHaveClass('text-secondary-foreground');
			});
		});

		it('defaults to variant "default" when no variant is specified', () => {
			render(ButtonGroupTestHost, { props: { variant: undefined } });
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				expect(btn).toHaveClass('bg-none');
				expect(btn).toHaveClass('text-white');
			});
		});
	});

	// ---------------------------------------------------------------------------
	// Edge Cases
	// ---------------------------------------------------------------------------
	describe('edge cases', () => {
		it('handles empty items array without crashing', () => {
			render(ButtonGroupTestHost, {
				props: { customItems: [] }
			});
			const group = screen.getByRole('group');
			expect(group).toBeInTheDocument();
			expect(screen.queryAllByRole('button')).toHaveLength(0);
		});

		it('handles only text items (no buttons)', () => {
			render(ButtonGroupTestHost, {
				props: {
					customItems: [
						{ type: 'text', content: 'A' },
						{ type: 'text', content: 'B' }
					]
				}
			});
			expect(screen.getByText('A')).toBeInTheDocument();
			expect(screen.getByText('B')).toBeInTheDocument();
			expect(screen.queryAllByRole('button')).toHaveLength(0);
		});

		it('handles only separators (no buttons)', () => {
			render(ButtonGroupTestHost, {
				props: {
					customItems: [
						{ type: 'separator' },
						{ type: 'separator' }
					]
				}
			});
			expect(screen.getAllByRole('separator')).toHaveLength(2);
			expect(screen.queryAllByRole('button')).toHaveLength(0);
		});

		it('renders mixed items in correct order', () => {
			render(ButtonGroupTestHost, {
				props: {
					customItems: [
						{ type: 'text', content: 'Prefix' },
						{ type: 'button', label: 'One' },
						{ type: 'separator' },
						{ type: 'button', label: 'Two' }
					]
				}
			});
			const group = screen.getByRole('group');
			const children = Array.from(group.children);

			// Text → Button → Separator → Button
			expect(children[0]).toHaveAttribute('data-slot', 'button-group-text');
			expect(children[0]).toHaveTextContent('Prefix');
			expect(children[1]).toHaveAttribute('data-slot', 'button');
			expect(children[1]).toHaveTextContent('One');
			expect(children[2]).toHaveAttribute('data-slot', 'button-group-separator');
			expect(children[3]).toHaveAttribute('data-slot', 'button');
			expect(children[3]).toHaveTextContent('Two');
		});

		it('propagates both size and variant together via context', () => {
			render(ButtonGroupTestHost, {
				props: { size: 'lg', variant: 'ghost' }
			});
			const buttons = screen.getAllByRole('button');
			buttons.forEach((btn) => {
				// size lg
				expect(btn).toHaveClass('text-base');
				expect(btn).toHaveClass('px-4');
				// variant ghost
				expect(btn).toHaveClass('bg-transparent');
				expect(btn).toHaveClass('border-transparent');
				expect(btn).toHaveClass('text-foreground');
			});
		});

		it('renders a single button correctly (no separators or text)', () => {
			render(ButtonGroupTestHost, {
				props: { customItems: [{ type: 'button', label: 'Solo' }] }
			});
			expect(screen.getByRole('button', { name: 'Solo' })).toBeInTheDocument();
			expect(screen.queryAllByRole('separator')).toHaveLength(0);
		});
	});
});
