import { CaretDownIcon } from "@phosphor-icons/react";
import {
	Button,
	Disclosure,
	DisclosurePanel,
	Heading,
} from "react-aria-components";
import * as z from "zod";
import type { XML } from "@/lib/feed";
import {
	getOccurrences,
	type Test,
	type TestOutput,
	type ValidationState,
} from "@/lib/tests/_index";
import { TestOutputIcon } from "./TestOutputIcon";
import { TestResultIcon } from "./TestResultIcon";
import { XmlPathPreview } from "./XMLPathPreview";
import { formatInteger } from "@/lib/number";

/** One ledger row: a test's verdict, with its outputs in a collapsible panel */
export function TestResultDisplay({
	xml,
	test,
	state,
	outputs,
	index,
}: {
	xml: XML | undefined;
	test: Test;
	state: ValidationState;
	outputs: TestOutput[] | undefined;
	index: number;
}) {
	const expandable = (outputs?.length ?? 0) > 0;
	const problems =
		outputs?.filter(
			(output) => output.status === "error" || output.status === "warn",
		).length ?? 0;
	const running = !outputs && state !== "pending";

	return (
		<Disclosure className="group border-rule border-b last:border-b-0">
			<Heading>
				<Button
					slot={expandable ? "trigger" : undefined}
					className={`focus-visible:bg-paper-deep pointer-fine:data-hovered:bg-paper-deep/70 data-pressed:bg-paper-deep -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 px-2 py-3 text-left transition-colors duration-150 ease-out outline-none ${expandable ? "cursor-pointer" : "cursor-default"}`}
				>
					<TestResultIcon
						key={outputs ? "resolved" : "pending"}
						outputs={outputs}
						size={22}
						className={running ? "animate-spin" : "verdict-reveal"}
						style={{ transitionDelay: `${index * 40}ms` }}
					/>
					<span className="min-w-0 grow truncate text-[17px] font-medium [&_code]:font-mono [&_code]:text-base [&_code]:font-normal">
						{test.name}
					</span>
					{problems > 0 && (
						<span className="text-ink-muted flex-none text-[15px] tabular-nums">
							{formatInteger(problems)}
							<span className="sr-only">
								{problems === 1 ? " problem" : " problems"}
							</span>
						</span>
					)}
					<CaretDownIcon
						aria-hidden
						size={14}
						weight="bold"
						className={`text-ink-muted flex-none transition-transform duration-200 ease-(--ease-out-strong) group-data-expanded:rotate-180 ${expandable ? "" : "invisible"}`}
					/>
				</Button>
			</Heading>
			<DisclosurePanel className="disclosure-panel">
				<ul className="flex flex-col gap-4 pt-1 pb-5 pl-[34px]">
					{outputs?.map((output, i) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: outputs have no stable identity
							key={i}
							className="flex flex-col gap-2"
						>
							<div className="flex items-start gap-2">
								<TestOutputIcon
									status={output.status}
									size={16}
									className="mt-[3px]"
								/>
								<span className="prose-message leading-snug">
									{output.message instanceof z.ZodError
										? z.prettifyError(output.message).replace("✖ ", "")
										: output.message}
								</span>
							</div>
							{xml && getOccurrences(output).length > 0 && (
								<XmlPathPreview
									xml={xml}
									occurrences={getOccurrences(output)}
									attribute={output.attribute}
									text={output.text}
								/>
							)}
						</li>
					))}
				</ul>
			</DisclosurePanel>
		</Disclosure>
	);
}
