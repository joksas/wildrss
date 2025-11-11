import type { ReactNode } from "react";
import type { XML } from "@/lib/feed";
import type { Path } from "@/lib/tests/_index";

function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttrValue(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

type HighlightOptions = {
  attributeToHighlight?: string;
  highlightText?: boolean;
};

function renderPathXML(
  root: XML,
  path: Path,
  options?: HighlightOptions,
): ReactNode[] {
  const indent = "  ";
  const lines: ReactNode[] = [];
  const { attributeToHighlight, highlightText } = options ?? {};

  function renderAttrs(
    tag: string,
    attrs?: Record<string, string>,
    isLeaf: boolean = false,
  ): ReactNode[] {
    if (!attrs) return [];
    const keys = Object.keys(attrs).sort();
    const nodes: ReactNode[] = [];

    for (const key of keys) {
      const raw = attrs[key] ?? "";
      const shouldHighlight = isLeaf && attributeToHighlight === key;

      if (shouldHighlight) {
        nodes.push(
          <span key={`attr-${tag}-${key}`}>
            {" "}
            {key}="
            <span className="rounded bg-amber-200 px-0.5">
              {escAttrValue(String(raw))}
            </span>
            "
          </span>,
        );
      } else {
        nodes.push(` ${key}="${escAttrValue(String(raw))}"`);
      }
    }

    return nodes;
  }

  function renderTextContent(text: string, isLeaf: boolean): ReactNode {
    if (!isLeaf || !highlightText) return escText(text);
    return <span className="rounded bg-amber-200 px-0.5">{escText(text)}</span>;
  }

  function pushLine(depth: number, parts: ReactNode[]): void {
    const indentStr = indent.repeat(depth);
    lines.push(
      <span key={lines.length}>
        {indentStr}
        {parts}
      </span>,
    );
    lines.push("\n");
  }

  function step(parent: XML, depth: number, segmentIndex: number): void {
    const [tag, idx] = path[segmentIndex];

    const node = parent[tag]?.at(idx) as XML | undefined;
    if (!node) return;

    const attrsRecord = node["@attributes"]?.[0];
    const text = node["@text"];
    const isLeaf = segmentIndex === path.length - 1;
    const selfClosing = isLeaf && !text;

    const attrsNodes =
      path.length > 1 && tag === "rss"
        ? [] // hide rss attrs for readability, as before
        : renderAttrs(tag, attrsRecord, isLeaf);

    if (isLeaf) {
      if (selfClosing) {
        pushLine(depth, ["<", tag, ...attrsNodes, " />"]);
      } else {
        const textNode = text ? renderTextContent(text, true) : "";
        pushLine(depth, [
          "<",
          tag,
          ...attrsNodes,
          ">",
          textNode,
          "</",
          tag,
          ">",
        ]);
      }
      return;
    }

    // Non-leaf: open tag
    pushLine(depth, ["<", tag, ...attrsNodes, ">"]);

    // Extra context for items (unchanged, but now as nodes)
    if (tag === "item") {
      const item_title = node["title"]?.at(0)?.["@text"];
      if (item_title) {
        pushLine(depth + 1, ["<title>", escText(item_title), "</title>"]);
      }

      const item_guid = node["guid"]?.at(0)?.["@text"];
      if (item_guid) {
        pushLine(depth + 1, ["<guid>", escText(item_guid), "</guid>"]);
      }
    }

    step(node, depth + 1, segmentIndex + 1);

    // Close tag
    pushLine(depth, ["</", tag, ">"]);
  }

  step(root, 0, 0);
  return lines;
}

export function XmlPathPreview({
  xml,
  path,
  attribute,
  text,
}: {
  xml: XML;
  path: Path;
  attribute?: string;
  text?: boolean;
}) {
  const xmlNodes = renderPathXML(xml, path, {
    attributeToHighlight: attribute,
    highlightText: text,
  });

  return (
    <pre className="overflow-x-auto">
      <code>{xmlNodes}</code>
    </pre>
  );
}
