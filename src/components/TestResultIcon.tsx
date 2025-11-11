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
import type { TestOutput } from "@/lib/tests/_index";

export function TestResultIcon({
  outputs,
  ...props
}: { outputs: TestOutput[] | undefined } & ComponentProps<Icon>) {
  const defaultClassName = "flex-none";

  const status: "error" | "warn" | "passed" | undefined = (() => {
    if (!outputs) return undefined;
    if (outputs.find((result) => result.status === "error")) return "error";
    if (outputs.find((result) => result.status === "warn")) return "warn";
    return "passed";
  })();

  return match(status)
    .with(undefined, () => (
      <CircleDashedIcon
        {...props}
        weight="bold"
        className={twMerge(defaultClassName, props.className, "text-amber-950")}
      />
    ))
    .with("passed", () => (
      <CheckCircleIcon
        {...props}
        className={twMerge(defaultClassName, props.className, "text-green-800")}
      />
    ))
    .with("warn", () => (
      <WarningCircleIcon
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
        {...props}
        className={twMerge(defaultClassName, props.className, "text-red-700")}
      />
    ))
    .exhaustive();
}
