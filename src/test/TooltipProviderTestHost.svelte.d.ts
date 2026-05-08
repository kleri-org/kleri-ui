interface Props {
    mode?: 'tooltip' | 'utility-button';
    open?: boolean;
    triggerText?: string;
    contentText?: string;
    buttonText?: string;
    tooltip?: string;
    disabled?: boolean;
    class?: string;
}
declare const TooltipProviderTestHost: import("svelte").Component<Props, {}, "">;
type TooltipProviderTestHost = ReturnType<typeof TooltipProviderTestHost>;
export default TooltipProviderTestHost;
