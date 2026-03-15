import * as z from "zod";
import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag, type MinimalTestOutput } from "./_utils";

export default {
  key: "title",
  group: "rss",
  name: <code>&lt;title&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const allTitles: Record<string, Path[]> = {};
    const addTitle = (title: string, path: Path) => {
      if (allTitles[title]) {
        allTitles[title] = [...allTitles[title], path];
      } else {
        allTitles[title] = [path];
      }
    };

    const channelTitles = xml.rss?.at(0)?.channel?.at(0)?.title ?? [];
    outputs.push(
      ..._checkTitle({
        tags: channelTitles,
        path: [
          ["rss", 0],
          ["channel", 0],
        ],
        setTitle: addTitle,
      }),
    );

    const liveItems =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    for (let i = 0; i < liveItems.length; i++) {
      const liveItem = liveItems[i];
      outputs.push(
        ..._checkTitle({
          tags: liveItem.title ?? [],
          path: [
            ["rss", 0],
            ["channel", 0],
            ["podcast:liveItem", i],
          ],
          setTitle: addTitle,
        }),
      );
    }

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      outputs.push(
        ..._checkTitle({
          tags: item.title ?? [],
          path: [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
          setTitle: addTitle,
        }),
      );
    }

    for (const kind of ["channel", "podcast:liveItem", "item"]) {
      const numTitles = Object.entries(allTitles).reduce(
        (sum, [, paths]) =>
          sum + paths.filter((path) => path.at(-2)?.[0] === kind).length,
        0,
      );
      outputs.push({
        status: "info",
        message: (
          <>
            Found {numTitles}{" "}
            <code>
              {"<"}
              {kind}
              {">"}
            </code>{" "}
            {numTitles === 1 ? "title" : "titles"}
          </>
        ),
      });
    }

    return outputs;
  },
} satisfies Test;

function _checkTitle({
  tags,
  path,
  setTitle,
}: {
  tags: XML[];
  path: Path;
  setTitle: (title: string, path: Path) => void;
}): TestOutput[] {
  return checkTag(tags, "title", path, {
    limits: { min: 1, max: 1 },
    attributes: [],
    children: [],
    text: {
      validator: ({ idx, text }) => {
        const outputs: MinimalTestOutput[] = [];

        const res = z.string().trim().nonempty().safeParse(text);
        if (res.success) {
          setTitle(res.data, [...path, ["title", idx]]);
        } else {
          outputs.push({ status: "error", message: res.error });
        }

        return outputs;
      },
    },
  });
}
