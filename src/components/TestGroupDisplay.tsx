import type { XML } from "@/lib/feed";
import {
  getTestGroupName,
  sortTestOutputs,
  type Test,
  type TestGroup,
  type TestOutput,
  type ValidationState,
} from "@/lib/tests/_index";
import { TestResultDisplay } from "./TestResultDisplay";

export function TestGroupDisplay({
  tests,
  group,
  results,
  xml,
  state,
}: {
  tests: Test[];
  group: TestGroup;
  results: Record<string, TestOutput[]>;
  xml: XML | undefined;
  state: ValidationState;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-bold font-display text-2xl">
        {getTestGroupName(group)}
      </span>
      {tests
        .filter((test) => test.group === group)
        .map((test) => {
          const outputs = sortTestOutputs(results[test.key]);
          return (
            <TestResultDisplay
              key={test.key}
              xml={xml}
              state={state}
              test={test}
              outputs={outputs}
            />
          );
        })}
    </div>
  );
}
