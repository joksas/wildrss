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

/** A titled ledger of tests belonging to one namespace */
export function TestGroupDisplay({
	tests,
	group,
	results,
	xml,
	state,
	startIndex,
}: {
	tests: Test[];
	group: TestGroup;
	results: Record<string, TestOutput[]>;
	xml: XML | undefined;
	state: ValidationState;
	startIndex: number;
}) {
	const groupTests = tests.filter((test) => test.group === group);

	return (
		<section className="flex flex-col">
			<h2 className="border-ink -mx-2 border-b-2 px-2 pb-2 font-serif text-xl leading-tight font-semibold">
				{getTestGroupName(group)}
			</h2>
			{groupTests.map((test, i) => (
				<TestResultDisplay
					key={test.key}
					index={startIndex + i}
					xml={xml}
					state={state}
					test={test}
					outputs={sortTestOutputs(results[test.key])}
				/>
			))}
		</section>
	);
}
