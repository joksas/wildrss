import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";

// Constants
const PODCAST_NAMESPACE = "https://podcastindex.org/namespace/1.0";
const PODCAST_NAMESPACE_ALIASES = [
  PODCAST_NAMESPACE,
  "https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md",
];
const PREFIX = "podcast";

export default {
  key: "podcast:namespace",
  group: "podcast",
  name: <code>xmlns:podcast</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

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

    const declared = declarations[PREFIX];
    const usesPrefix = rss !== undefined && _usesPrefix(rss, `${PREFIX}:`);

    // Alternate prefixes
    for (const [prefix, { uri, path }] of Object.entries(declarations)) {
      if (prefix === PREFIX || !PODCAST_NAMESPACE_ALIASES.includes(uri)) continue;
      outputs.push({
        status: "warn",
        message: (
          <>
            Podcast namespace is declared with prefix <code>{prefix}</code>. The
            specification allows this, but apps that look for the{" "}
            <code>{PREFIX}:</code> prefix will ignore these tags, and this
            validator does not check them
          </>
        ),
        path,
        attribute: `xmlns:${prefix}`,
      });
    }

    if (!declared) {
      if (usesPrefix)
        outputs.push({
          status: "error",
          message: (
            <>
              Feed uses <code>{PREFIX}:</code> tags without declaring the
              namespace. Namespace-aware XML parsers treat an undeclared prefix
              as an error. Add{" "}
              <code>
                xmlns:{PREFIX}="{PODCAST_NAMESPACE}"
              </code>{" "}
              to the <code>{"<rss>"}</code> tag
            </>
          ),
          path: rssPath,
        });
      else
        outputs.push({
          status: "info-optional",
          message: "Podcast namespace is not declared (optional)",
          path: rssPath,
        });
      return outputs;
    }

    if (!PODCAST_NAMESPACE_ALIASES.includes(declared.uri)) {
      outputs.push({
        status: "error",
        message: (
          <>
            Expected <code>{PODCAST_NAMESPACE}</code> - found{" "}
            <code>{declared.uri}</code>. Namespace-aware apps will not recognize
            the <code>{PREFIX}:</code> tags
          </>
        ),
        path: declared.path,
        attribute: `xmlns:${PREFIX}`,
      });
      return outputs;
    }

    outputs.push({
      status: "info",
      message: (
        <>
          Podcast namespace is declared as <code>{declared.uri}</code>
        </>
      ),
      path: declared.path,
      attribute: `xmlns:${PREFIX}`,
    });

    return outputs;
  },
} satisfies Test;

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
