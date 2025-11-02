import type { XML } from "@/lib/feed";
import type { Path } from "@/lib/tests/_index";

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

function renderPathXML(root: XML, path: Path): string {
  const indent = "  ";
  const lines: string[] = [];

  function step(parent: XML, depth: number, segmentIndex: number): void {
    const [tag, idx] = path[segmentIndex];

    const node = parent[tag][idx];
    const attrs = node["@attributes"];
    const open = `<${tag}${attrsToString(attrs?.at(0))}>`;
    const close = `</${tag}>`;

    const isLeaf = segmentIndex === path.length - 1;
    if (isLeaf) {
      const text = node["@text"];
      if (text) {
        lines.push(`${indent.repeat(depth)}${open}${escText(text)}${close}`);
      } else {
        lines.push(`${indent.repeat(depth)}${open}${close}`);
      }
      return;
    }

    lines.push(`${indent.repeat(depth)}${open}`);
    step(node, depth + 1, segmentIndex + 1);
    lines.push(`${indent.repeat(depth)}${close}`);
  }

  step(root, 0, 0);
  return lines.join("\n");
}

export function XmlPathPreview({ xml, path }: { xml: XML; path: Path }) {
  const xmlString = renderPathXML(xml, path);
  return (
    <pre className="overflow-x-auto">
      <code>{xmlString}</code>
    </pre>
  );
}
