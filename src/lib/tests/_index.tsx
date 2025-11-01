import {
  CheckCircleIcon,
  CircleIcon,
  type Icon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";
import type { XML } from "../feed";

/** Test for an RSS feed */
export type Test = {
  name: string;
  test: (
    args: TestArgs,
  ) => Promise<TestResult & ({ status: "passed" } | { status: "failed" })>;
};

/** Test arguments */
export type TestArgs = { xml: XML; required_server: boolean };

/** Result of a test */
export type TestResult =
  | { status: "pending" }
  | { status: "running" }
  | { status: "passed" }
  | { status: "failed"; error: string; path?: Path };

/** Test error path */
export type Path = [tag: string, index: number][];

export function TestResultIcon({
  status,
  ...props
}: { status: TestResult["status"] } & ComponentProps<Icon>) {
  return match(status)
    .with("pending", () => (
      <CircleIcon
        {...props}
        className={twMerge(props.className, "text-gray-300")}
      />
    ))
    .with("running", () => (
      <CircleIcon
        {...props}
        className={twMerge(props.className, "text-yellow-500")}
      />
    ))
    .with("passed", () => (
      <CheckCircleIcon
        {...props}
        className={twMerge(props.className, "text-green-800")}
      />
    ))
    .with("failed", () => (
      <XCircleIcon
        {...props}
        className={twMerge(props.className, "text-red-700")}
      />
    ))
    .exhaustive();
}
