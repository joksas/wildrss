import { describe, expect, it } from "vitest";
import type { Path, TestOutput } from "./_index";
import { mergeRepeatedOutputs } from "./_utils";

function descriptionPath(item: number): Path {
	return [
		["rss", 0],
		["channel", 0],
		["item", item],
		["description", 0],
	];
}

describe("mergeRepeatedOutputs", () => {
	it("merges outputs that differ only in their notes and keeps each note", () => {
		const outputs: TestOutput[] = [0, 1].map((item) => ({
			status: "error",
			message: "Description cannot exceed 10000 characters",
			path: descriptionPath(item),
			note: `found ${10_001 + item} characters`,
			text: true,
		}));
		const merged = mergeRepeatedOutputs(outputs);
		expect(merged).toHaveLength(1);
		expect(merged[0].occurrences).toEqual([
			{ path: descriptionPath(0), note: "found 10001 characters" },
			{ path: descriptionPath(1), note: "found 10002 characters" },
		]);
	});

	it("keeps outputs apart when their status or highlighted attribute differs", () => {
		const base = { message: "Not a valid web URL", path: descriptionPath(0) };
		const merged = mergeRepeatedOutputs([
			{ ...base, status: "error", attribute: "url" },
			{ ...base, status: "warn", attribute: "url" },
			{ ...base, status: "error", attribute: "href" },
		]);
		expect(merged).toHaveLength(3);
	});
});
