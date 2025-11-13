import {
  CircleDashedIcon,
  type Icon,
  InfoIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";
import type { TestOutput } from "@/lib/tests/_index";

export function TestOutputIcon({
  output,
  ...props
}: { output: TestOutput | undefined } & ComponentProps<Icon>) {
  const defaultClassName = "flex-none";
  const status = output?.status;

  return match(status)
    .with(undefined, () => (
      <CircleDashedIcon
        weight="bold"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-amber-950")}
      />
    ))
    .with("info", () => (
      <InfoIcon
        weight="fill"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-amber-950")}
      />
    ))
    .with("info-optional", () => (
      <InfoIcon
        weight="fill"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-amber-950")}
      />
    ))
    .with("warn", () => (
      <WarningCircleIcon
        weight="fill"
        {...props}
        className={twMerge(
          defaultClassName,
          props.className,
          "text-yellow-600",
        )}
      />
    ))
    .with("error", () => (
      <XCircleIcon
        weight="fill"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-red-700")}
      />
    ))
    .exhaustive();
}
