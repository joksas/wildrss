import {
  CheckCircleIcon,
  CircleDashedIcon,
  CircleIcon,
  type Icon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";
import type { XML } from "../feed";

export type State = "pending" | "fetching" | "parsing" | "testing";

/** Test for an RSS feed */
export type Test = {
  key: string;
  name: React.ReactNode;
  test: (args: TestArgs) => Promise<TestOutput>;
};

/** Test arguments */
export type TestArgs = { xml: XML; required_server: boolean };

/** Test output */
export type TestOutput =
  | { status: "passed" }
  | {
      status: "failed";
      error: string;
      path?: Path;
      attribute?: string;
      text?: boolean;
    };

/** Result of a test */
export type TestResult = Pick<Test, "key"> &
  (
    | { status: "running" }
    | { status: "passed" }
    | {
        status: "failed";
        error: string;
        path?: Path;
        attribute?: string;
        text?: boolean;
      }
  );

/** Test error path */
export type Path = [tag: string, index: number][];

export function TestResultIcon({
  status,
  ...props
}: { status: TestResult["status"] | undefined } & ComponentProps<Icon>) {
  return match(status)
    .with(undefined, () => (
      <CircleDashedIcon
        {...props}
        weight="bold"
        className={twMerge(props.className, "text-amber-950")}
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
