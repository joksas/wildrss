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

  const status: "error" | "warn" | "passed" | "passed-optional" | undefined =
    (() => {
      if (!outputs) return undefined;
      if (outputs.find((result) => result.status === "error")) return "error";
      if (outputs.find((result) => result.status === "warn")) return "warn";
      if (outputs.find((result) => result.status === "info-optional"))
        return "passed-optional";
      return "passed";
    })();

  return match(status)
    .with(undefined, () => (
      <CircleDashedIcon
        weight="bold"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-amber-950")}
      />
    ))
    .with("passed", () => (
      <CheckCircleIcon
        weight="fill"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-green-800")}
      />
    ))
    .with("passed-optional", () => (
      <CheckCircleIcon
        weight="bold"
        {...props}
        className={twMerge(defaultClassName, props.className, "text-green-800")}
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
