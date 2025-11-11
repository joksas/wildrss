import { match } from "ts-pattern";
import type { XML } from "../feed";

export type ValidationState = "pending" | "fetching" | "parsing" | "testing";

/** Sort priority */
const STATUS_PRIORITY: Record<TestOutput["status"], number> = {
  error: 0,
  warn: 1,
  info: 2,
};

/** Test for an RSS feed */
export type Test = {
  key: string;
  group: TestGroup;
  name: React.ReactNode;
  test: (args: TestArgs) => Promise<TestOutput[]>;
};

/** Test arguments */
export type TestArgs = { xml: XML; required_server: boolean };

/** Test output */
export type TestOutput = {
  status: "info" | "error" | "warn";
  message: React.ReactNode;
  path?: Path;
  attribute?: string;
  text?: boolean;
};

/** Test error path */
export type Path = [tag: string, index: number][];

/** Sort an array of TestOutput objects in-place by status */
export function sortTestOutputs(
  outputs: TestOutput[] | undefined,
): TestOutput[] | undefined {
  if (!outputs) return undefined;
  return outputs.sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status],
  );
}

export const TEST_GROUPS = ["basic", "rss", "itunes", "podcast"] as const;
export type TestGroup = (typeof TEST_GROUPS)[number];

export function getTestGroupName(group: TestGroup): string {
  return match(group)
    .with("basic", () => "Basic tests")
    .with("rss", () => "RSS namespace tests")
    .with("itunes", () => "Apple Podcasts namespace tests")
    .with("podcast", () => "Podcast namespace tests")
    .exhaustive();
}
