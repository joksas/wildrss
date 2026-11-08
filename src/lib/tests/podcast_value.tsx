import * as z from "zod";
import { parseDuration } from "../duration";
import { isEmail } from "../email";
import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkRemoteItems } from "./_remote_item";
import {
  checkTag,
  countNote,
  lengthNote,
  type MinimalTestOutput,
  optionalTagAbsent,
} from "./_utils";

// Constants
const KEYSEND_ADDRESS_LENGTH = 66;

type ValueParentKind = "channel" | "item" | "podcast:liveItem";

export default {
  key: "podcast:value",
  group: "podcast",
  name: <code>&lt;podcast:value&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const channelPath: Path = [
      ["rss", 0],
      ["channel", 0],
    ];
    const channel = xml.rss?.at(0)?.channel?.at(0);
    outputs.push(
      ..._testValue({
        parent: channel,
        path: channelPath,
        kind: "channel",
        duration: undefined,
      }),
    );

    const items = channel?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      outputs.push(
        ..._testValue({
          parent: item,
          path: [...channelPath, ["item", i]],
          kind: "item",
          duration: parseDuration(item["itunes:duration"]?.at(0)?.["@text"]),
        }),
      );
    }

    const liveItems = channel?.["podcast:liveItem"] ?? [];
    for (let i = 0; i < liveItems.length; i++) {
      outputs.push(
        ..._testValue({
          parent: liveItems[i],
          path: [...channelPath, ["podcast:liveItem", i]],
          kind: "podcast:liveItem",
          duration: undefined,
        }),
      );
    }

    const numValues = [channel, ...items, ...liveItems].reduce(
      (sum, parent) => sum + (parent?.["podcast:value"]?.length ?? 0),
      0,
    );
    if (numValues === 0)
      outputs.push(optionalTagAbsent("podcast:value", channelPath));

    return outputs;
  },
} satisfies Test;

function _testValue({
  parent,
  path,
  kind,
  duration,
}: {
  parent: XML | undefined;
  path: Path;
  kind: ValueParentKind;
  duration: number | undefined;
}): TestOutput[] {
  const outputs: TestOutput[] = [];

  const valueTags = parent?.["podcast:value"];
  outputs.push(
    ...checkTag(valueTags, "podcast:value", path, {
      limits: { min: 0 },
      attributes: [
        { name: "type", type: "required" },
        { name: "method", type: "required" },
        { name: "suggested", type: "optional" },
      ],
      children: [
        { name: "podcast:valueRecipient", min: 1 },
        { name: "podcast:valueTimeSplit", min: 0 },
      ],
    }),
  );
  if (!valueTags) return outputs;

  outputs.push(..._checkDuplicateValueBlocks(valueTags, path));

  for (let valueIdx = 0; valueIdx < valueTags.length; valueIdx++) {
    const valueTag = valueTags[valueIdx];
    const valuePath: Path = [...path, ["podcast:value", valueIdx]];

    outputs.push(
      ..._checkValueRecipients(
        valueTag["podcast:valueRecipient"],
        valuePath,
        kind === "channel",
      ),
    );
    outputs.push(
      ..._checkValueTimeSplits(
        valueTag["podcast:valueTimeSplit"],
        valuePath,
        duration,
      ),
    );
  }

  return outputs;
}

/** Warn about value blocks under the same parent that share a type and method */
function _checkDuplicateValueBlocks(valueTags: XML[], path: Path): TestOutput[] {
  const outputs: TestOutput[] = [];

  const blocksByKind: Record<string, number[]> = {};
  for (let idx = 0; idx < valueTags.length; idx++) {
    const attributes = valueTags[idx]["@attributes"]?.[0] ?? {};
    const key = `${attributes.type}|${attributes.method}`;
    blocksByKind[key] = [...(blocksByKind[key] ?? []), idx];
  }

  for (const indices of Object.values(blocksByKind)) {
    if (indices.length <= 1) continue;
    for (const idx of indices)
      outputs.push({
        status: "warn",
        message: (
          <>
            Another{" "}
            <code>
              {"<"}podcast:value{">"}
            </code>{" "}
            tag in the same parent has this type and method - apps may use any
            one of them
          </>
        ),
        path: [...path, ["podcast:value", idx]],
      });
  }

  return outputs;
}

function _checkValueRecipients(
  tags: XML[] | undefined,
  path: Path,
  isChannel: boolean,
): TestOutput[] {
  return checkTag(tags, "podcast:valueRecipient", path, {
    attributes: [
      { name: "name", type: "recommended" },
      {
        name: "customKey",
        type: "optional",
        validator: ({ attributes }) => {
          const customKey = attributes["customKey"];
          const customValue = attributes["customValue"];
          if (customValue && !customKey)
            return [
              {
                status: "error",
                message: (
                  <>
                    If <code>customValue</code> is provided,{" "}
                    <code>customKey</code> must be specified too
                  </>
                ),
              },
            ];
          return [];
        },
      },
      {
        name: "customValue",
        type: "optional",
        validator: ({ attributes }) => {
          const customKey = attributes["customKey"];
          const customValue = attributes["customValue"];
          if (customKey && !customValue) {
            return [
              {
                status: "error",
                message: (
                  <>
                    If <code>customKey</code> is provided,{" "}
                    <code>customValue</code> must be specified too
                  </>
                ),
              },
            ];
          }
          return [];
        },
      },
      {
        name: "type",
        type: "required",
        validator: ({ attributes }) => {
          const outputs: MinimalTestOutput[] = [];

          const _type = attributes["type"];
          if (_type === "node" && isChannel)
            outputs.push({
              status: "info",
              message: (
                <>
                  Lightning addresses are now supported in{" "}
                  <code>
                    {"<"}podcast:valueRecipient{">"}
                  </code>
                  , consider changing to <code>lnaddress</code>
                </>
              ),
            });

          const error = z.enum(["node", "lnaddress"]).safeParse(_type).error;
          if (error) outputs.push({ status: "error", message: error });

          return outputs;
        },
      },
      {
        name: "address",
        type: "required",
        validator: ({ attributes }) => {
          const outputs: MinimalTestOutput[] = [];

          const _type = attributes.type;
          const address = attributes.address;

          // Keysend
          if (
            _type === "node" &&
            address &&
            address.length !== KEYSEND_ADDRESS_LENGTH
          )
            outputs.push({
              status: "error",
              message: (
                <>
                  If <code>type</code> is <code>node</code>,{" "}
                  <code>address</code> must be {KEYSEND_ADDRESS_LENGTH}{" "}
                  characters long
                </>
              ),
              note: lengthNote(address),
            });

          // Lightning address
          if (_type === "lnaddress" && address && !isEmail(address))
            outputs.push({
              status: "error",
              message: (
                <>
                  If <code>type</code> is <code>lnaddress</code>,{" "}
                  <code>address</code> must look like an email, i.e.{" "}
                  <code>username@domain.com</code>
                </>
              ),
            });

          return outputs;
        },
      },
      {
        name: "split",
        type: "required",
        validator: ({ attributes }) => {
          const outputs: MinimalTestOutput[] = [];

          const split = attributes.split;
          const error = z.coerce
            .number()
            .int()
            .positive()
            .optional()
            .safeParse(split).error;
          if (error) outputs.push({ status: "error", message: error });

          return outputs;
        },
      },
      {
        name: "fee",
        type: "optional",
        validator: ({ attributes }) => {
          const outputs: MinimalTestOutput[] = [];

          const fee = attributes.fee;
          const error = z.coerce.boolean().optional().safeParse(fee).error;
          if (error) outputs.push({ status: "error", message: error });

          return outputs;
        },
      },
    ],
    children: [],
  });
}

function _checkValueTimeSplits(
  tags: XML[] | undefined,
  path: Path,
  duration: number | undefined,
): TestOutput[] {
  const outputs: TestOutput[] = [];

  outputs.push(
    ...checkTag(tags, "podcast:valueTimeSplit", path, {
      attributes: [
        {
          name: "startTime",
          type: "required",
          validator: ({ attributes }) => {
            const outputs: MinimalTestOutput[] = [];

            const startTime = attributes.startTime;
            const startTimeRes = z.coerce
              .number()
              .nonnegative()
              .optional()
              .safeParse(startTime);
            if (startTimeRes.success) {
              const startTimeParsed = startTimeRes.data;
              if (
                startTimeParsed !== undefined &&
                duration !== undefined &&
                startTimeParsed > duration
              ) {
                outputs.push({
                  status: "error",
                  message: "Start time cannot be greater than the item duration",
                  note: `item duration ${Math.round(duration)} seconds`,
                });
              }
            } else {
              outputs.push({
                status: "error",
                message: startTimeRes.error,
              });
            }

            return outputs;
          },
        },
        {
          name: "duration",
          type: "required",
          validator: ({ attributes }) => {
            const outputs: MinimalTestOutput[] = [];

            const duration = attributes.duration;
            const error = z.coerce
              .number()
              .positive()
              .optional()
              .safeParse(duration).error;
            if (error) outputs.push({ status: "error", message: error });

            return outputs;
          },
        },
        {
          name: "remoteStartTime",
          type: "optional",
          validator: ({ attributes }) => {
            const outputs: MinimalTestOutput[] = [];

            const remoteStartTime = attributes.remoteStartTime;
            const error = z.coerce
              .number()
              .nonnegative()
              .optional()
              .safeParse(remoteStartTime).error;
            if (error) outputs.push({ status: "error", message: error });

            return outputs;
          },
        },
        {
          name: "remotePercentage",
          type: "optional",
          validator: ({ attributes }) => {
            const outputs: MinimalTestOutput[] = [];

            const remotePercentage = attributes.remotePercentage;
            const numberError = z.coerce
              .number()
              .optional()
              .safeParse(remotePercentage).error;
            if (numberError) {
              outputs.push({ status: "error", message: numberError });
            } else {
              const rangeError = z.coerce
                .number()
                .min(0, {
                  message:
                    "Remote percentage must be at least 0 - most apps will assume 0% in this case",
                })
                .max(100, {
                  message:
                    "Remote percentage must be at most 100 - most apps will assume 100% in this case",
                })
                .optional()
                .safeParse(remotePercentage).error;
              if (rangeError)
                outputs.push({ status: "warn", message: rangeError });
            }

            return outputs;
          },
        },
      ],
      children: [
        { name: "podcast:remoteItem", min: 0 },
        { name: "podcast:valueRecipient", min: 0 },
      ],
    }),
  );
  if (!tags) return outputs;

  for (let idx = 0; idx < tags.length; idx++) {
    const tag = tags[idx];
    const splitPath: Path = [...path, ["podcast:valueTimeSplit", idx]];
    const recipients = tag["podcast:valueRecipient"];
    const remoteItems = tag["podcast:remoteItem"];
    const numRecipients = recipients?.length ?? 0;
    const numRemoteItems = remoteItems?.length ?? 0;

    if (numRecipients > 0 && numRemoteItems > 0) {
      outputs.push({
        status: "error",
        message: (
          <>
            Must contain either{" "}
            <code>
              {"<"}podcast:valueRecipient{">"}
            </code>{" "}
            tags or a single{" "}
            <code>
              {"<"}podcast:remoteItem{">"}
            </code>
            , not both
          </>
        ),
        path: splitPath,
      });
    } else if (numRemoteItems > 1) {
      outputs.push({
        status: "error",
        message: (
          <>
            Expected at most 1{" "}
            <code>
              {"<"}podcast:remoteItem{">"}
            </code>{" "}
            tag
          </>
        ),
        path: splitPath,
        note: countNote(numRemoteItems),
      });
    } else if (numRecipients === 0 && numRemoteItems === 0) {
      outputs.push({
        status: "error",
        message: (
          <>
            Must contain at least one{" "}
            <code>
              {"<"}podcast:valueRecipient{">"}
            </code>{" "}
            tag or a single{" "}
            <code>
              {"<"}podcast:remoteItem{">"}
            </code>
          </>
        ),
        path: splitPath,
      });
    }

    outputs.push(..._checkValueRecipients(recipients, splitPath, false));
    outputs.push(...checkRemoteItems(remoteItems, splitPath));
  }

  return outputs;
}
