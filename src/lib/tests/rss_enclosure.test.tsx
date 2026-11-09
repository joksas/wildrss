import { describe, expect, it } from "vitest";
import { parseFeed } from "../feed";
import type { TestArgs, TestOutput } from "./_index";
import testEnclosure from "./rss_enclosure";

async function lengthOutputs(length: string): Promise<TestOutput[]> {
  const xml = parseFeed(
    `<rss version="2.0"><channel><item><enclosure url="https://example.com/a.mp3" length="${length}" type="audio/mpeg"/></item></channel></rss>`,
  );
  const outputs = await testEnclosure.test({ xml } as TestArgs);
  return outputs.filter((output) => output.attribute === "length");
}

describe("enclosure length", () => {
  it("accepts a positive byte count", async () => {
    expect(await lengthOutputs("5650889")).toEqual([]);
  });

  it("warns when the size is marked unknown with 0", async () => {
    const outputs = await lengthOutputs("0");
    expect(outputs.map((output) => output.status)).toEqual(["warn"]);
  });

  it.each(["", " ", "-1", "1.5", "abc"])(
    "rejects %j",
    async (length) => {
      const outputs = await lengthOutputs(length);
      expect(outputs.map((output) => output.status)).toEqual(["error"]);
    },
  );
});
