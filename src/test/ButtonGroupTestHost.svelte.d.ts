import type { Component } from 'svelte';
import type { ButtonGroupItem } from '$lib/button/KleriButtonGroup/types.js';
interface Props {
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'lg';
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    includeSeparator?: boolean;
    includeText?: boolean;
    separatorCount?: number;
    textContent?: string;
    className?: string;
    groupId?: string;
    ariaLabel?: string;
    buttonLabels?: string[];
    buttonIcons?: (Component | undefined)[];
    buttonTooltips?: (string | undefined)[];
    buttonDisabled?: boolean[];
    buttonOnclicks?: (((e: MouseEvent) => void) | undefined)[];
    buttonClasses?: (string | undefined)[];
    customItems?: ButtonGroupItem[];
}
declare const ButtonGroupTestHost: Component<Props, {}, "">;
type ButtonGroupTestHost = ReturnType<typeof ButtonGroupTestHost>;
export default ButtonGroupTestHost;
