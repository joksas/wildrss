import { describe, expect, it } from "vitest";
import type { XML } from "@/lib/feed";
import type { Occurrence } from "@/lib/tests/_index";
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

function transcriptOccurrence(item: number, note?: string): Occurrence {
	return {
		path: [
			["rss", 0],
			["channel", 0],
			["item", item],
			["podcast:transcript", 0],
		],
		note,
	};
}

const ALL_OCCURRENCES = [0, 1, 2, 3].map((item) => transcriptOccurrence(item));

describe("buildXmlExcerpt", () => {
	it("prints shared ancestors once and moves the marked attribute first", () => {
		const { code } = buildXmlExcerpt(FEED, ALL_OCCURRENCES.slice(0, 2), {
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
		const { code, marks } = buildXmlExcerpt(FEED, ALL_OCCURRENCES, {
			attribute: "type",
		});
		expect(marks.map(([start, end]) => code.slice(start, end))).toEqual(
			Array(4).fill('type="application/srt"'),
		);
	});

	it("replaces occurrences past the limit with a comment inside the shared ancestor", () => {
		const { code, marks } = buildXmlExcerpt(FEED, ALL_OCCURRENCES, {
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
				{
					path: [
						["rss", 0],
						["channel", 0],
						["item", 2],
						["title", 0],
					],
				},
			],
			{ text: true },
		);
		expect(code.match(/<title>/g)).toHaveLength(1);
		expect(marks.map(([start, end]) => code.slice(start, end))).toEqual([
			"Episode 2",
		]);
	});

	it("prints each occurrence's note as a comment above its element", () => {
		const { code } = buildXmlExcerpt(FEED, [
			transcriptOccurrence(0, "found 2 tags"),
			transcriptOccurrence(1),
		]);
		const lines = code.split("\n");
		const transcriptLines = lines.flatMap((line, i) =>
			line.includes("<podcast:transcript") ? [i] : [],
		);
		expect(lines[transcriptLines[0] - 1]).toBe("      <!-- found 2 tags -->");
		expect(lines[transcriptLines[1] - 1]).toBe("      <guid>guid-1</guid>");
	});

	it("marks a placeholder inside the parent where an absent tag would go", () => {
		const { code, marks } = buildXmlExcerpt(FEED, [
			{
				path: [
					["rss", 0],
					["channel", 0],
					["item", 1],
					["itunes:duration", 0],
				],
			},
		]);
		expect(code).toBe(
			[
				"<rss>",
				"  <channel>",
				"    <item>",
				"      <title>Episode 1</title>",
				"      <guid>guid-1</guid>",
				"      <!-- no <itunes:duration> tag -->",
				"    </item>",
				"  </channel>",
				"</rss>",
			].join("\n"),
		);
		expect(marks.map(([start, end]) => code.slice(start, end))).toEqual([
			"<!-- no <itunes:duration> tag -->",
		]);
	});

	it("flattens and shortens long text content", () => {
		const description = `<p>${"word ".repeat(100)}</p>\n<div>tail</div>`;
		const feed = {
			rss: [{ channel: [{ description: [{ "@text": description }] }] }],
		} as unknown as XML;
		const { code, marks } = buildXmlExcerpt(
			feed,
			[
				{
					path: [
						["rss", 0],
						["channel", 0],
						["description", 0],
					],
				},
			],
			{ text: true },
		);
		const [marked] = marks.map(([start, end]) => code.slice(start, end));
		expect(code.split("\n")).toHaveLength(5);
		expect(marked.startsWith("&lt;p>word word")).toBe(true);
		expect(marked.endsWith("…")).toBe(true);
		expect(marked).not.toContain("tail");
	});

	it("prints the nested elements of a target element", () => {
		const feed = {
			rss: [
				{
					channel: [
						{
							"itunes:category": [
								{
									"@attributes": [{ text: "Society & Culture" }],
									"itunes:category": [
										{ "@attributes": [{ text: "Philosophy" }] },
									],
								},
							],
						},
					],
				},
			],
		} as unknown as XML;
		const { code } = buildXmlExcerpt(feed, [
			{
				path: [
					["rss", 0],
					["channel", 0],
					["itunes:category", 0],
				],
			},
		]);
		expect(code).toBe(
			[
				"<rss>",
				"  <channel>",
				'    <itunes:category text="Society &amp; Culture">',
				'      <itunes:category text="Philosophy" />',
				"    </itunes:category>",
				"  </channel>",
				"</rss>",
			].join("\n"),
		);
	});

	it("replaces nested elements past the limit with a comment", () => {
		const feed = {
			rss: [
				{
					channel: [
						{
							"podcast:value": [
								{
									"podcast:valueRecipient": Array.from(
										{ length: 7 },
										(_, n) => ({
											"@attributes": [{ name: `R${n}` }],
										}),
									),
								},
							],
						},
					],
				},
			],
		} as unknown as XML;
		const { code } = buildXmlExcerpt(feed, [
			{
				path: [
					["rss", 0],
					["channel", 0],
					["podcast:value", 0],
				],
			},
		]);
		expect(code.match(/<podcast:valueRecipient/g)).toHaveLength(5);
		expect(code).toContain("      <!-- 2 more -->");
	});
});
