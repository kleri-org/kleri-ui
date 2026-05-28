import { type VariantProps, tv } from 'tailwind-variants';

export const kleriToggleVariants = tv({
	base: 'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap border-2 font-normal transition-colors transition-transform duration-150 ease-out select-none active:scale-[0.97] focus-visible:z-10 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		variant: {
			default:
				'border-transparent bg-muted/30 text-foreground hover:bg-muted data-[state=on]:kleri-bg data-[state=on]:border-black data-[state=on]:text-black',
			outline:
				'border-border bg-transparent text-foreground hover:bg-muted/50 data-[state=on]:kleri-bg data-[state=on]:border-black data-[state=on]:text-black',
			ghost:
				'border-transparent bg-transparent text-foreground hover:bg-muted/50 data-[state=on]:kleri-bg data-[state=on]:border-black data-[state=on]:text-black'
		},
		size: {
			sm: 'h-7 min-w-7 rounded-lg px-2.5 text-xs [&_svg]:size-3.5',
			default: 'h-9 min-w-9 rounded-kleri px-3 text-sm [&_svg]:size-4',
			lg: 'h-10 min-w-10 rounded-kleri px-4 text-base [&_svg]:size-5'
		}
	},
	defaultVariants: {
		variant: 'default',
		size: 'default'
	}
});

export type ToggleVariant = VariantProps<typeof kleriToggleVariants>['variant'];
export type ToggleSize = VariantProps<typeof kleriToggleVariants>['size'];
export type ToggleVariants = VariantProps<typeof kleriToggleVariants>;
