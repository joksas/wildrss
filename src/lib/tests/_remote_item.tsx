import * as z from "zod";
import type { XML } from "../feed";
import { WebURL } from "../url";
import type { Path, TestOutput } from "./_index";
import { checkTag } from "./_utils";

const BASE_MEDIUMS = [
  "podcast",
  "music",
  "video",
  "film",
  "audiobook",
  "newsletter",
  "blog",
  "publisher",
  "course",
] as const;

/** Values allowed in podcast:medium, including list variants */
export const MEDIUMS = [
  ...BASE_MEDIUMS,
  ...BASE_MEDIUMS.map((medium) => `${medium}L` as const),
  "mixed",
] as const;

/** Check podcast:remoteItem tags under the given parent path */
export function checkRemoteItems(
  tags: XML[] | undefined,
  path: Path,
): TestOutput[] {
  return checkTag(tags, "podcast:remoteItem", path, {
    attributes: [
      { name: "feedGuid", type: "required", schema: z.uuid() },
      { name: "feedUrl", type: "optional", schema: WebURL },
      {
        name: "itemGuid",
        type: "optional",
        schema: z.string().trim().nonempty(),
      },
      { name: "medium", type: "optional", schema: z.enum(MEDIUMS) },
      { name: "title", type: "optional", schema: z.string().trim().nonempty() },
    ],
    children: [],
  });
}
