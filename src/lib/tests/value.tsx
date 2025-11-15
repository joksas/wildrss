import * as z from "zod";
import { isEmail } from "../email";
import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag } from "./_utils";

// Constants
const KEYSEND_ADDRESS_LENGTH = 66;

export const testValue: Test = {
  key: "podcast:value",
  group: "podcast",
  name: <code>&lt;podcast:value&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const channel = xml.rss?.at(0)?.channel?.at(0);
    outputs.push(
      ..._testValue(channel, [
        ["rss", 0],
        ["channel", 0],
      ]),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      outputs.push(
        ..._testValue(item, [
          ["rss", 0],
          ["channel", 0],
          ["item", i],
        ]),
      );
    }

    return outputs;
  },
};

function _testValue(tag: XML | undefined, path: Path): TestOutput[] {
  const outputs = [];

  const podcastValueTags = tag?.["podcast:value"];
  outputs.push(
    ...checkTag(podcastValueTags, "podcast:value", path, {
      limits: { min: 0, max: 1, pushOptional: true },
      attributes: [
        { name: "type", type: "required" },
        { name: "method", type: "optional" },
        { name: "suggested", type: "optional" },
      ],
      children: [
        { name: "podcast:valueRecipient", min: 1 },
        { name: "podcast:valueTimeSplit", min: 0 },
      ],
    }),
  );

  const podcastValueRecipientTags =
    podcastValueTags?.at(0)?.["podcast:valueRecipient"];
  if (podcastValueRecipientTags) {
    outputs.push(
      ...checkTag(
        podcastValueRecipientTags,
        "podcast:valueRecipient",
        [...path, ["podcast:value", 0]],
        {
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
                const outputs: TestOutput[] = [];

                const _type = attributes["type"];
                if (_type === "node")
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

                const error = z
                  .enum(["node", "lnaddress"])
                  .safeParse(_type).error;
                if (error) outputs.push({ status: "error", message: error });

                return outputs;
              },
            },
            {
              name: "address",
              type: "required",
              validator: ({ attributes }) => {
                const outputs: TestOutput[] = [];

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
                        characters long - found {address.length}
                      </>
                    ),
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
                const outputs: TestOutput[] = [];

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
                const outputs: TestOutput[] = [];

                const fee = attributes.fee;
                const error = z.coerce
                  .boolean()
                  .optional()
                  .safeParse(fee).error;
                if (error) outputs.push({ status: "error", message: error });

                return outputs;
              },
            },
          ],
        },
      ),
    );
  }

  return outputs;
}
