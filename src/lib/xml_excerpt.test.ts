import { describe, expect, it } from "vitest";
import type { XML } from "@/lib/feed";
import type { Path } from "@/lib/tests/_index";
import { buildXmlExcerpt } from "@/lib/xml_excerpt";

const FEED = {
	rss: [
		{
			"@attributes": [{ version: "2.0" }],
			channel: [
				{
					item: [0, 1, 2, 3].map((n) => ({
						title: [{ "@text": `Episode ${n}` }],
						guid: [{ "@text": `guid-${n}` }],
						"podcast:transcript": [
							{
								"@attributes": [
									{
										url: `https://a.test/${n}?x=1&y=2`,
										type: "application/srt",
									},
								],
							},
						],
					})),
				},
			],
		},
	],
} as unknown as XML;

function transcriptPath(item: number): Path {
	return [
		["rss", 0],
		["channel", 0],
		["item", item],
		["podcast:transcript", 0],
	];
}

const ALL_PATHS = [0, 1, 2, 3].map(transcriptPath);

describe("buildXmlExcerpt", () => {
	it("prints shared ancestors once and moves the marked attribute first", () => {
		const { code } = buildXmlExcerpt(FEED, ALL_PATHS.slice(0, 2), {
			attribute: "type",
		});
		expect(code).toBe(
			[
				"<rss>",
				"  <channel>",
				"    <item>",
				"      <title>Episode 0</title>",
				"      <guid>guid-0</guid>",
				'      <podcast:transcript type="application/srt" url="https://a.test/0?x=1&amp;y=2" />',
				"    </item>",
				"    <item>",
				"      <title>Episode 1</title>",
				"      <guid>guid-1</guid>",
				'      <podcast:transcript type="application/srt" url="https://a.test/1?x=1&amp;y=2" />',
				"    </item>",
				"  </channel>",
				"</rss>",
			].join("\n"),
		);
	});

	it("marks the attribute on every shown occurrence", () => {
		const { code, marks } = buildXmlExcerpt(FEED, ALL_PATHS, {
			attribute: "type",
		});
		expect(marks.map(([start, end]) => code.slice(start, end))).toEqual(
			Array(4).fill('type="application/srt"'),
		);
	});

	it("replaces occurrences past the limit with a comment inside the shared ancestor", () => {
		const { code, marks } = buildXmlExcerpt(FEED, ALL_PATHS, {
			attribute: "type",
			limit: 1,
		});
		expect(marks).toHaveLength(1);
		expect(code).not.toContain("Episode 1");
		expect(code.split("\n").slice(-3)).toEqual([
			"    <!-- 3 more -->",
			"  </channel>",
			"</rss>",
		]);
	});

	it("marks text content and skips item context the path already shows", () => {
		const { code, marks } = buildXmlExcerpt(
			FEED,
			[
				[
					["rss", 0],
					["channel", 0],
					["item", 2],
					["title", 0],
				],
			],
			{ text: true },
		);
		expect(code.match(/<title>/g)).toHaveLength(1);
		expect(marks.map(([start, end]) => code.slice(start, end))).toEqual([
			"Episode 2",
		]);
	});
});
