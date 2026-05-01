<script lang="ts">
	import type { Component } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { ClassValue } from "clsx";
	import type { WithElementRef } from "$lib/utils";

	import { cn } from "$lib/utils";
	import { Eye, EyeOff } from "@lucide/svelte";

	type Props = {
		// biome-ignore lint/suspicious/noExplicitAny: input value can be any type
		value?: any;
		label?: string;
		errors?: string[];
		InputIcon?: Component;
		placeholder?: string;
		type?: string;
		required?: boolean;
		withBorder?: boolean;
		class?: ClassValue;
		shake?: boolean;
	} & WithElementRef<HTMLInputAttributes>;

	let {
		value = $bindable(),
		label,
		errors = $bindable(),
		InputIcon,
		class: className,
		withBorder = true,
		placeholder = "",
		required,
		shake = false,
		type = "text",
		...restProps
	}: Props = $props();

	let isPasswordVisible = $state(false);
	let currentInputType = $derived(
		type === "password" ? (isPasswordVisible ? "text" : "password") : type
	);

	let borderClasses = $derived(
		withBorder ? "border-border border-2" : "border-2 border-transparent"
	);
</script>

<label class="block text-sm font-medium w-full select-none">
	<!-- Label and Errors -->
	<div class="inline-flex flex-row align-middle items-center">
		{#if label}
			<p class="indent-2">
				{label}
			</p>
		{/if}
		{#if errors}
			{#each errors as error}
				<p class="indent-2 font-spacemono text-xs text-red-400">
					({error})
				</p>
			{/each}
		{/if}
	</div>

	<!-- Main Input -->
	<div
		class={cn(
			"flex flex-row items-center justify-end my-1 gap-2 py-3 pl-4 w-full rounded-kleri outline-black focus-within:kleri-border dark:focus-within:kleri-border-dark focus:outline-black focus:ring-black active:ring-black active:outline-black overflow-hidden",
			borderClasses,
			errors &&
				errors.length > 0 &&
				"border-red-400 focus:border-red-400 focus-within:border-red-400",
			className
		)}
		class:shake-it={errors && errors.length > 0}
	>
		<InputIcon size={22} strokeWidth={2.5} class="text-foreground" />

		<input
			type={currentInputType}
			{required}
			class="bg-transparent w-full outline-hidden focus:ring-0 placeholder-muted-foreground px-1 text-foreground"
			bind:value
			{placeholder}
			{...restProps}
		/>

		{#if type === "password"}
			<button
				type="button"
				class="pr-3 flex items-center justify-center text-foreground cursor-pointer focus:outline-hidden transition-colors"
				onclick={(e) => {
					e.preventDefault();
					isPasswordVisible = !isPasswordVisible;
				}}
			>
				{#if isPasswordVisible}
					<EyeOff size={22} strokeWidth={2.5} />
				{:else}
					<Eye size={22} strokeWidth={2.5} />
				{/if}
			</button>
		{/if}
	</div>
</label>

<style>
	@keyframes shake-it {
		0% {
			transform: translateX(0);
		}

		10% {
			transform: translateX(-9px);
		}

		20% {
			transform: translateX(8px);
		}

		30% {
			transform: translateX(-7px);
		}

		40% {
			transform: translateX(6px);
		}

		50% {
			transform: translateX(-5px);
		}

		60% {
			transform: translateX(4px);
		}

		70% {
			transform: translateX(-3px);
		}

		80% {
			transform: translateX(2px);
		}

		90% {
			transform: translateX(-1px);
		}

		100% {
			transform: translateX(0);
		}
	}

	.shake-it {
		animation: shake-it 0.5s ease-in-out;
	}
</style>
