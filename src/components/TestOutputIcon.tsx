import {
	type Icon,
	InfoIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";
import type { TestOutput } from "@/lib/tests/_index";

/** Icon for a single test output */
export function TestOutputIcon({
	status,
	...props
}: { status: TestOutput["status"] } & ComponentProps<Icon>) {
	const className = (color: string) =>
		twMerge("flex-none", props.className, color);

	return match(status)
		.with("info", "info-optional", () => (
			<InfoIcon
				weight="fill"
				{...props}
				className={className("text-ink-muted")}
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
