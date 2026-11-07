import type { XML } from "../feed";
import type { Path, TestOutput } from "./_index";

export type NamespaceSpecification = {
  label: string;
  prefix: string;
  uri: string;
  aliases: string[];
  absent: TestOutput["status"];
};

/** Check that a namespace is declared on rss or channel under its usual prefix and URI */
export function checkNamespace(
  xml: XML,
  { label, prefix, uri: canonicalURI, aliases, absent }: NamespaceSpecification,
): TestOutput[] {
  const outputs: TestOutput[] = [];
  const knownURIs = [canonicalURI, ...aliases];

  const rss = xml.rss?.at(0);
  const channel = rss?.channel?.at(0);
  const rssPath: Path = [["rss", 0]];
  const declarations: Record<string, { uri: string; path: Path }> = {};
  const declarationSources: [XML | undefined, Path][] = [
    [channel, [...rssPath, ["channel", 0]]],
    [rss, rssPath],
  ];
  for (const [tag, path] of declarationSources) {
    for (const [key, uri] of Object.entries(tag?.["@attributes"]?.[0] ?? {})) {
      if (key.startsWith("xmlns:") && uri !== undefined)
        declarations[key.slice("xmlns:".length)] = { uri: uri.trim(), path };
    }
  }

  const declared = declarations[prefix];
  const usesPrefix = rss !== undefined && _usesPrefix(rss, `${prefix}:`);

  // Alternate prefixes
  for (const [otherPrefix, { uri, path }] of Object.entries(declarations)) {
    if (otherPrefix === prefix || !knownURIs.includes(uri)) continue;
    outputs.push({
      status: "warn",
      message: (
        <>
          {label} is declared with prefix <code>{otherPrefix}</code>. XML allows
          this, but apps that look for the <code>{prefix}:</code> prefix will
          ignore these tags, and this validator does not check them
        </>
      ),
      path,
      attribute: `xmlns:${otherPrefix}`,
    });
  }

  if (!declared) {
    if (usesPrefix)
      outputs.push({
        status: "error",
        message: (
          <>
            Feed uses <code>{prefix}:</code> tags without declaring the
            namespace. Namespace-aware XML parsers treat an undeclared prefix as
            an error. Add{" "}
            <code>
              xmlns:{prefix}="{canonicalURI}"
            </code>{" "}
            to the <code>{"<rss>"}</code> tag
          </>
        ),
        path: rssPath,
      });
    else
      outputs.push({
        status: absent,
        message: `${label} is not declared${absent === "info-optional" ? " (optional)" : ""}`,
        path: rssPath,
      });
    return outputs;
  }

  if (!knownURIs.includes(declared.uri)) {
    const differsInCase = knownURIs.some(
      (uri) => uri.toLowerCase() === declared.uri.toLowerCase(),
    );
    outputs.push({
      status: differsInCase ? "warn" : "error",
      message: (
        <>
          Expected <code>{canonicalURI}</code> - found{" "}
          <code>{declared.uri}</code>.{" "}
          {differsInCase
            ? "Namespace URIs are case-sensitive, so namespace-aware apps may not recognize"
            : "Namespace-aware apps will not recognize"}{" "}
          the <code>{prefix}:</code> tags
        </>
      ),
      path: declared.path,
      attribute: `xmlns:${prefix}`,
    });
    return outputs;
  }

  outputs.push({
    status: "info",
    message: (
      <>
        {label} is declared as <code>{declared.uri}</code>
      </>
    ),
    path: declared.path,
    attribute: `xmlns:${prefix}`,
  });

  return outputs;
}

/** Check whether any tag in the tree uses the given prefix */
function _usesPrefix(tag: XML, prefix: string): boolean {
  for (const [key, children] of Object.entries(tag)) {
    if (key === "@attributes" || key === "@text") continue;
    if (key.startsWith(prefix)) return true;
    if (!Array.isArray(children)) continue;
    if (children.some((child) => _usesPrefix(child as XML, prefix))) return true;
  }
  return false;
}
