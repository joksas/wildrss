import { createFileRoute } from "@tanstack/react-router";
import { XMLParser } from "fast-xml-parser";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: App });

const URL = "https://feeds.fountain.fm/XFlRiU4hNCUBSuXmzYeu";

type TestResult =
  | { status: "pending" }
  | { status: "running" }
  | { status: "passed" }
  | { status: "failed"; error: string; path: string[] };

export type _XML<K extends readonly string[], L extends readonly string[]> = {
  [P in K[number]]: string | undefined;
} & {
  [P in L[number]]: Record<string, string>;
} & {
  [P in Exclude<Exclude<string, K[number]>, L[number]>]: _XML<K, L>[];
};
type XML = _XML<["@text"], ["@attributes"]>;

const TESTS: {
  name: string;
  test: (
    xml: XML,
  ) => Promise<TestResult & ({ status: "passed" } | { status: "failed" })>;
}[] = [
  {
    name: "Title tag",
    test: async (xml) => {
      const titleTag = xml.rss.at(0)?.channel.at(0)?.title.at(0);
      if (!titleTag)
        return {
          status: "failed",
          error: "Missing <title>",
          path: ["rss", "channel"],
        };
      const title = titleTag["@text"];
      if (!title)
        return {
          status: "failed",
          error: "Missing <title> value",
          path: ["rss", "channel", "title"],
        };
      return { status: "passed" };
    },
  },
  {
    name: "podcast:value tag",
    test: async (xml) => {
      const valueTag = xml.rss.at(0)?.channel.at(0)?.["podcast:value"].at(0);
      if (!valueTag)
        return {
          status: "failed",
          error: "Missing <podcast:value>",
          path: ["rss", "channel", "podcast:value"],
        };
      return { status: "passed" };
    },
  },
];

function App() {
  const [testResults, setTestResults] = useState<TestResult[]>(
    TESTS.map((_) => ({ status: "pending" })),
  );
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    try {
      setRunning(true);
      setTestResults(TESTS.map((_) => ({ status: "pending" })));

      const content = await (await fetch(URL)).text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        alwaysCreateTextNode: true,
        transformTagName: (name) => name.toLocaleLowerCase(),
        transformAttributeName: (name) => name.toLocaleLowerCase(),
        attributesGroupName: "@attributes",
        textNodeName: "@text",
        attributeNamePrefix: "",
        isArray: () => true,
      });
      const xml = parser.parse(content) as XML;
      console.log(xml);

      for (let i = 0; i < TESTS.length; i++) {
        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? { status: "running" } : p)),
        );

        const result = await TESTS[i].test(xml);

        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? result : p)),
        );
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-5">
      <h1 className="font-bold text-2xl">Homepage</h1>
      <button
        className="w-fit cursor-pointer border border-sky-950 bg-sky-100 px-3 py-2 font-bold text-sky-950 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={runTests}
        disabled={running}
      >
        {running ? "Running tests..." : "Validate feed"}
      </button>
      <ul className="list-none space-y-1">
        {TESTS.map((test, index) => {
          const result = testResults[index];
          const status_icon =
            result?.status === "running"
              ? "⏳"
              : result?.status === "passed"
                ? "✅"
                : result?.status === "failed"
                  ? "❌"
                  : "⚪";

          return (
            <li key={test.name} className="flex items-start gap-2">
              <span>{status_icon}</span>
              <div className="flex-1">
                <span className="font-medium">{test.name}</span>
                {result.status === "failed" && (
                  <div className="mt-1 text-red-600 text-sm">
                    {result.error}
                    {result.path && (
                      <span className="ml-2 text-gray-500">
                        ({result.path.join(" → ")})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
