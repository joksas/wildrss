import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fetchFeed, parseFeed, type XML } from "@/lib/feed";
import {
  type Path,
  type Test,
  type TestResult,
  TestResultIcon,
} from "@/lib/tests/_index";
import { testItunesOwner } from "@/lib/tests/itunes_owner";
import { testTitle } from "@/lib/tests/title";
import { testValue } from "@/lib/tests/value";

export const Route = createFileRoute("/")({ component: App });

const URL = "https://www.feed.behindthesch3m3s.com/feed.xml";
const TESTS: Test[] = [testTitle, testValue, testItunesOwner];

function App() {
  const [xml, setXML] = useState<XML | undefined>();
  const [testResults, setTestResults] = useState<TestResult[]>(
    TESTS.map((_) => ({ status: "pending" })),
  );
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    try {
      setRunning(true);
      setTestResults(TESTS.map((_) => ({ status: "pending" })));

      const xml_string = await fetchFeed(URL);
      const _xml = parseFeed(xml_string);
      setXML(_xml);

      for (let i = 0; i < TESTS.length; i++) {
        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? { status: "running" } : p)),
        );

        const result = await TESTS[i].test(_xml);

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
      <ul className="flex list-none flex-col gap-1">
        {TESTS.map((test, index) => {
          const result = testResults[index];

          return (
            <li key={test.name} className="flex items-center gap-1">
              <TestResultIcon
                status={result.status}
                size={20}
                weight="fill"
                className="flex-none"
              />
              <span className="font-medium">
                {test.name}
                {result.status === "failed" && (
                  <>
                    <span className="text-red-600 text-sm">
                      {" "}
                      {result.error}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {" "}
                      ({result.path.join(" → ")})
                    </span>
                    <XmlPathPreview
                      xml={xml!}
                      path={result.path}
                      showXmlDeclaration
                    />
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attrsToString(attrs?: Record<string, string>): string {
  if (!attrs) return "";
  // preserve stable ordering by key
  return Object.keys(attrs)
    .sort()
    .map((k) => ` ${k}="${String(attrs[k]).replace(/"/g, "&quot;")}"`)
    .join("");
}

/**
 * Render only the minimal XML “breadcrumb” defined by `path`,
 * including attributes at each level and the leaf text (if present).
 */
function renderPathXML(root: XML, path: Path, indent = "  "): string {
  if (path.length === 0) return "";

  const lines: string[] = [];

  function step(parent: XML, depth: number, segmentIndex: number): void {
    const [tag, idx] = path[segmentIndex];

    const arr = parent[tag];
    if (!Array.isArray(arr) || arr[idx] == null) {
      lines.push(`${indent.repeat(depth)}<!-- Missing ${tag}[${idx}] -->`);
      return;
    }

    const node = arr[idx] as XML;
    const attrs =
      (node["@attributes"] as [Record<string, string>] | undefined) ??
      undefined;
    const open = `<${tag}${attrsToString(attrs?.at(0))}>`;
    const close = `</${tag}>`;

    const isLeaf = segmentIndex === path.length - 1;
    if (isLeaf) {
      const text = (node["@text"] as string | undefined) ?? "";
      if (text.length) {
        lines.push(`${indent.repeat(depth)}${open}${escText(text)}${close}`);
      } else {
        // No @text at leaf; still render empty element pair
        lines.push(`${indent.repeat(depth)}${open}${close}`);
      }
      return;
    }

    // Non-leaf: wrap the next step inside
    lines.push(`${indent.repeat(depth)}${open}`);
    step(node, depth + 1, segmentIndex + 1);
    lines.push(`${indent.repeat(depth)}${close}`);
  }

  // The root “parent” is the whole object; first segment must exist in it.
  step(root, 0, 0);
  return lines.join("\n");
}

export function XmlPathPreview({
  xml,
  path,
  className,
  showXmlDeclaration = false,
}: {
  xml: XML;
  path: Path;
  className?: string;
  showXmlDeclaration?: boolean;
}) {
  const xmlString = renderPathXML(xml, path);
  const header = showXmlDeclaration
    ? `<?xml version="1.0" encoding="UTF-8"?>\n`
    : "";
  return (
    <pre className={className}>
      <code>{header + xmlString}</code>
    </pre>
  );
}
