import {
	CheckCircleIcon,
	CircleDashedIcon,
	type Icon,
	WarningCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";
import { getTestVerdict, type TestOutput } from "@/lib/tests/_index";

/** Verdict icon for a whole test; dashed while the test has not run */
export function TestResultIcon({
	outputs,
	...props
}: { outputs: TestOutput[] | undefined } & ComponentProps<Icon>) {
	const className = (color: string) =>
		twMerge("flex-none", props.className, color);

	if (!outputs)
		return (
			<CircleDashedIcon
				weight="bold"
				{...props}
				className={className("text-ink-muted")}
			/>
		);

	return match(getTestVerdict(outputs))
		.with("passed", () => (
			<CheckCircleIcon
				weight="fill"
				{...props}
				className={className("text-pass")}
			/>
		))
		.with("passed-optional", () => (
			<CheckCircleIcon
				weight="bold"
				{...props}
				className={className("text-pass")}
			/>
		))
		.with("warn", () => (
			<WarningCircleIcon
				weight="fill"
				{...props}
				className={className("text-warn")}
			/>
		))
		.with("error", () => (
			<XCircleIcon
				weight="fill"
				{...props}
				className={className("text-fail")}
			/>
		))
		.exhaustive();
}
