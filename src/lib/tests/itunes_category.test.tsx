import { describe, expect, it } from "vitest";
import { parseFeed } from "../feed";
import type { TestArgs, TestOutput } from "./_index";
import { mergeRepeatedOutputs } from "./_utils";
import testItunesCategory from "./itunes_category";

async function runOnChannel(channel: string): Promise<TestOutput[]> {
  const xml = parseFeed(
    `<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0"><channel>${channel}</channel></rss>`,
  );
  const args = { xml } as TestArgs;
  return mergeRepeatedOutputs(await testItunesCategory.test(args));
}

function statuses(outputs: TestOutput[]): TestOutput["status"][] {
  return outputs.map((output) => output.status);
}

function messages(outputs: TestOutput[]): string {
  return outputs
    .map((output) =>
      typeof output.message === "string"
        ? output.message
        : JSON.stringify(output.message),
    )
    .join("\n");
}

describe("itunes:category", () => {
  it("reports an error when the channel has no category", async () => {
    const outputs = await runOnChannel("<title>Show</title>");
    expect(statuses(outputs)).toEqual(["error"]);
  });

  it("accepts an escaped ampersand category with a valid subcategory", async () => {
    const outputs = await runOnChannel(
      `<itunes:category text="Health &amp; Fitness"><itunes:category text="Mental Health"/></itunes:category><itunes:category text="True Crime"/>`,
    );
    expect(outputs).toEqual([
      {
        status: "info",
        message: "Feed is categorized as Health & Fitness › Mental Health, True Crime",
      },
    ]);
  });

  it("rejects a category with the wrong case", async () => {
    const outputs = await runOnChannel(`<itunes:category text="true crime"/>`);
    expect(statuses(outputs)).toEqual(["error"]);
    expect(messages(outputs)).toContain("True Crime");
  });

  it("names the parent when a subcategory is used at the top level", async () => {
    const outputs = await runOnChannel(`<itunes:category text="Documentary"/>`);
    expect(statuses(outputs)).toEqual(["error"]);
    expect(messages(outputs)).toContain("Society & Culture");
  });

  it("names the correct parent when a subcategory is nested in the wrong one", async () => {
    const outputs = await runOnChannel(
      `<itunes:category text="Arts"><itunes:category text="Politics"/></itunes:category>`,
    );
    expect(outputs.find((output) => output.status === "error")?.attribute).toBe(
      "text",
    );
    expect(messages(outputs)).toContain("News");
    expect(messages(outputs)).toContain("Feed is categorized as Arts");
  });

  it("rejects a category missing from Apple's list", async () => {
    const outputs = await runOnChannel(`<itunes:category text="Podcasts"/>`);
    expect(statuses(outputs)).toEqual(["error"]);
  });

  it("warns about categories Apple Podcasts ignores and lists all of them", async () => {
    const outputs = await runOnChannel(
      `<itunes:category text="Arts"/><itunes:category text="News"/><itunes:category text="History"/>`,
    );
    expect(statuses(outputs)).toEqual(["warn", "info"]);
    expect(outputs[0].occurrences).toEqual(
      ["primary", "secondary", "ignored"].map((note, i) => ({
        path: [
          ["rss", 0],
          ["channel", 0],
          ["itunes:category", i],
        ],
        note,
      })),
    );
    expect(messages(outputs)).toContain(
      "Feed is categorized as Arts, News, History",
    );
  });

  it("warns about subcategories Apple Podcasts ignores and lists all of them", async () => {
    const outputs = await runOnChannel(
      `<itunes:category text="Arts"><itunes:category text="Books"/><itunes:category text="Food"/></itunes:category>`,
    );
    expect(statuses(outputs)).toEqual(["warn", "info"]);
    expect(messages(outputs)).toContain(
      "Feed is categorized as Arts › Books, Arts › Food",
    );
  });
});
