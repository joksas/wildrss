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

    const node = parent[tag]?.at(idx);
    if (!node) return;
    const attrs = node["@attributes"];
    const text = node["@text"];
    const isLeaf = segmentIndex === path.length - 1;
    const selfClosing = isLeaf && !text;

    const attrsString =
      path.length > 1 && tag === "rss" ? "" : attrsToString(attrs?.at(0));
    const open = `<${tag}${attrsString}${selfClosing ? " />" : ">"}`;
    const close = selfClosing ? "" : `</${tag}>`;

    if (isLeaf) {
      if (text) {
        lines.push(`${indent.repeat(depth)}${open}${escText(text)}${close}`);
      } else {
        lines.push(`${indent.repeat(depth)}${open}${close}`);
      }
      return;
    }

    lines.push(`${indent.repeat(depth)}${open}`);
    if (tag === "item") {
      const item_title = node["title"]?.at(0)?.["@text"];
      if (item_title)
        lines.push(`${indent.repeat(depth + 1)}<title>${item_title}</title>`);
      const item_guid = node["guid"]?.at(0)?.["@text"];
      if (item_guid)
        lines.push(`${indent.repeat(depth + 1)}<guid>${item_guid}</guid>`);
    }
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
