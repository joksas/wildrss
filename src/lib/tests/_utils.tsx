import { isValidElement, type ReactNode } from "react";
import * as z from "zod";
import type { XML } from "../feed";
import {
  getOccurrences,
  type Occurrence,
  type Path,
  type TestOutput,
} from "./_index";

export type MinimalTestOutput = Omit<Omit<TestOutput, "path">, "attribute">;

/** Output marking an optional tag as absent */
export function optionalTagAbsent(name: string): TestOutput {
  return {
    status: "info-optional",
    message: (
      <span>
        No{" "}
        <code>
          {`<`}
          {name}
          {`>`}
        </code>{" "}
        tags found (optional)
      </span>
    ),
  };
}

export function checkTag(
  tags: XML[] | undefined,
  name: string,
  path: Path,
  options: {
    limits?: { min: number; max?: number; pushOptional?: boolean };
    attributes?: {
      name: string;
      type: "optional" | "recommended" | "required";
      validator?: (props: {
        text: string | undefined;
        attributes: Record<string, string | undefined>;
      }) => MinimalTestOutput[];
      schema?: z.ZodSchema;
    }[];
    children?: { name: string; min: number; max?: number }[];
    text?: {
      validator?: (props: {
        idx: number;
        text: string | undefined;
        attributes: Record<string, string | undefined>;
      }) => MinimalTestOutput[];
    };
  },
): TestOutput[] {
  const outputs: TestOutput[] = [];

  // Min / max
  if (options.limits) {
    const { min, max, pushOptional } = options.limits;
    const numTags = (tags ?? []).length;
    if (numTags < min) {
      outputs.push({
        status: "error",
        message: (
          <span>
            Expected {min !== max && "at least "}
            {min}{" "}
            <code>
              {`<`}
              {name}
              {`>`}
            </code>{" "}
            {min === 1 ? "tag" : "tags"}
          </span>
        ),
        path: [...path, [name, numTags]],
      });
    }
    if (max !== undefined && numTags > max) {
      outputs.push({
        status: "error",
        message: (
          <span>
            Expected {min !== max && "at most "}
            {max}{" "}
            <code>
              {`<`}
              {name}
              {`>`}
            </code>{" "}
            {max === 1 ? "tag" : "tags"}
          </span>
        ),
        occurrences: tagOccurrences(path, name, numTags),
      });
    }
    if (numTags === 0 && min === 0 && pushOptional) {
      outputs.push(optionalTagAbsent(name));
    }
  }

  if (!tags) return outputs;
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const tagPath: Path = [...path, [name, i]];

    // Attributes
    if (options.attributes) {
      const documentedAttributes = options.attributes;

      const attributes = tag
        ? Object.keys(tag["@attributes"]?.at(0) ?? {})
        : [];

      // Required attributes
      const requiredAttributes = documentedAttributes
        .filter((attr) => attr.type === "required")
        .map((attr) => attr.name);
      for (const requiredAttribute of requiredAttributes) {
        if (!attributes.includes(requiredAttribute))
          outputs.push({
            status: "error",
            message: (
              <span>
                Attribute <code>{requiredAttribute}</code> is required
              </span>
            ),
            path: tagPath,
          });
      }

      // Recommended attributes
      const recommendedAttributes = documentedAttributes
        .filter((attr) => attr.type === "recommended")
        .map((attr) => attr.name);
      for (const recommended of recommendedAttributes) {
        if (!attributes.includes(recommended))
          outputs.push({
            status: "warn",
            message: (
              <span>
                Attribute <code>{recommended}</code> is recommended
              </span>
            ),
            path: tagPath,
          });
      }

      // Allowed attributes
      const documentedAttributeNames = options.attributes.map(
        (attr) => attr.name,
      );
      for (const attribute of attributes) {
        const isDocumented = documentedAttributeNames.includes(attribute);
        if (!isDocumented) {
          const existingButWrongCase = documentedAttributeNames.find(
            (documentedAttribute) =>
              documentedAttribute.toLowerCase() === attribute.toLowerCase(),
          );
          outputs.push({
            status: "warn",
            message: (
              <span>
                Unrecognized attribute <code>{attribute}</code> - most apps will
                likely ignore it
                {existingButWrongCase && (
                  <>
                    . Did you mean <code>{existingButWrongCase}</code>?
                  </>
                )}
              </span>
            ),
            path: tagPath,
            attribute,
          });
        }
      }

      // Additional validation
      for (const { name, validator, schema } of documentedAttributes) {
        if (validator) {
          try {
            const attribute_outputs = validator({
              text: tag["@text"],
              attributes: tag["@attributes"]?.[0] ?? {},
            }).map((output) => ({
              ...output,
              path: tagPath,
              attribute: name,
            }));
            outputs.push(...attribute_outputs);
          } finally {
          }
        }
        if (schema) {
          const attr = tag["@attributes"]?.[0][name];
          if (!attr) continue;
          const error = schema.safeParse(attr).error;
          if (error) {
            outputs.push({
              status: "error",
              message: error,
              path: tagPath,
              attribute: name,
            });
          }
        }
      }
    }

    // Children
    if (options.children) {
      const documentedChildren = options.children;

      const actualChildren = Object.entries(tag ?? {}).filter(
        ([key]) => key !== "@attributes" && key !== "@text",
      );

      // Min / max conditions
      for (const documentedChild of documentedChildren) {
        const { min, max, name: documentedName } = documentedChild;

        const numMatchingChildren = tag[documentedName]?.length ?? 0;

        if (numMatchingChildren < min) {
          outputs.push({
            status: "error",
            message: (
              <span>
                Expected {min !== max && "at least "}
                {min}{" "}
                <code>
                  {`<`}
                  {documentedName}
                  {`>`}
                </code>{" "}
                {min === 1 ? "tag" : "tags"}
              </span>
            ),
            path: [...tagPath, [documentedName, numMatchingChildren]],
          });
        }

        if (max !== undefined && numMatchingChildren > max) {
          outputs.push({
            status: "error",
            message: (
              <span>
                Expected {min !== max && "at most "}
                {max}{" "}
                <code>
                  {`<`}
                  {documentedName}
                  {`>`}
                </code>{" "}
                {max === 1 ? "tag" : "tags"}
              </span>
            ),
            occurrences: tagOccurrences(
              tagPath,
              documentedName,
              numMatchingChildren,
            ),
          });
        }
      }

      // Unrecognized children
      for (const [actualChildName] of actualChildren) {
        const isDocumented = documentedChildren.find(
          ({ name }) => name === actualChildName,
        );
        if (!isDocumented) {
          outputs.push({
            status: "warn",
            message: (
              <span>
                Unrecognized child{" "}
                <code>
                  {"<"}
                  {actualChildName}
                  {">"}
                </code>{" "}
                - most apps will likely ignore it
              </span>
            ),
            path: [...tagPath, [actualChildName, 0]],
          });
        }
      }
    }

    // Text
    if (!options.text?.validator) continue;
    const textOutputs = options.text
      .validator({
        idx: i,
        text: tag["@text"],
        attributes: tag["@attributes"]?.[0] ?? {},
      })
      .map((output) => ({
        ...output,
        path: tagPath,
        text: true,
      }));
    outputs.push(...textOutputs);
  }

  return outputs;
}

/** Occurrences of the first `count` tags named `name` beneath the parent path */
export function tagOccurrences(
  parent: Path,
  name: string,
  count: number,
): Occurrence[] {
  return Array.from({ length: count }, (_, i) => ({
    path: [...parent, [name, i]],
  }));
}

/** Note stating the length of a value */
export function lengthNote(value: string): string {
  return `found ${value.length} characters`;
}

/** Path of the channel tag */
export const CHANNEL_PATH: Path = [
  ["rss", 0],
  ["channel", 0],
];

export type ParentLevel = "channel" | "item" | "podcast:liveItem";

export type Parent = { level: ParentLevel; tag: XML; path: Path };

/** List the channel, items and live items at the given levels, with their paths */
export function getParents(xml: XML, levels: ParentLevel[]): Parent[] {
  const channel = xml.rss?.at(0)?.channel?.at(0);
  if (!channel) return [];

  const parents: Parent[] = [];
  if (levels.includes("channel"))
    parents.push({ level: "channel", tag: channel, path: CHANNEL_PATH });
  for (const level of ["item", "podcast:liveItem"] as const) {
    if (!levels.includes(level)) continue;
    const tags = channel[level] ?? [];
    for (let i = 0; i < tags.length; i++)
      parents.push({ level, tag: tags[i], path: [...CHANNEL_PATH, [level, i]] });
  }
  return parents;
}

const HYPERTEXT_URL = z.url({ protocol: /^https?$/ });

/** Validate a hypertext URL, warning on http since the namespace requires https */
export function checkHypertextURL(value: string | undefined): MinimalTestOutput[] {
  if (value === undefined) return [];
  const url = value.trim();
  if (!HYPERTEXT_URL.safeParse(url).success)
    return [
      {
        status: "error",
        message: "Not a valid web URL",
      },
    ];
  if (url.toLowerCase().startsWith("http:"))
    return [
      {
        status: "warn",
        message: "Expected an https URL - the specification requires https",
      },
    ];
  return [];
}

/** Validate a BCP 47 language tag such as en or pt-BR */
export function checkLanguageTag(value: string | undefined): MinimalTestOutput[] {
  if (value === undefined) return [];
  try {
    Intl.getCanonicalLocales(value.trim());
    return [];
  } catch {
    return [
      {
        status: "error",
        message: (
          <>
            Expected a BCP 47 language tag such as <code>en</code> or{" "}
            <code>pt-BR</code> - found <code>{value}</code>
          </>
        ),
      },
    ];
  }
}

/** Merge outputs that repeat the same message into one output listing every occurrence */
export function mergeRepeatedOutputs(outputs: TestOutput[]): TestOutput[] {
  const groups = new Map<string, TestOutput[]>();
  for (const output of outputs) {
    if (getOccurrences(output).length === 0) {
      groups.set(`${groups.size}`, [output]);
      continue;
    }
    const key = [
      output.status,
      output.attribute ?? "",
      output.text ? "text" : "",
      _messageText(output.message),
    ].join("|");
    groups.set(key, [...(groups.get(key) ?? []), output]);
  }

  return [...groups.values()].map((group) => {
    const [first] = group;
    if (group.length === 1) return first;
    const message =
      first.message instanceof z.ZodError
        ? z.prettifyError(first.message).replace("✖ ", "")
        : first.message;
    return {
      status: first.status,
      message: (
        <>
          {message} ({group.length} tags)
        </>
      ),
      occurrences: group.flatMap(getOccurrences),
      attribute: first.attribute,
      text: first.text,
    };
  });
}

/** Plain text of a message, used to detect repeated messages */
function _messageText(message: TestOutput["message"]): string {
  if (message instanceof z.ZodError)
    return message.issues.map((issue) => issue.message).join("; ");
  return _nodeText(message);
}

function _nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(_nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return _nodeText(node.props.children);
  return "";
}

/** Warn about tags placed directly in the channel when they belong in items */
export function checkMisplacedInChannel(xml: XML, name: string): TestOutput[] {
  const tags = xml.rss?.at(0)?.channel?.at(0)?.[name] ?? [];
  if (tags.length === 0) return [];
  return [
    {
      status: "warn",
      message: (
        <>
          <code>
            {"<"}
            {name}
            {">"}
          </code>{" "}
          belongs in{" "}
          <code>
            {"<"}item{">"}
          </code>{" "}
          - apps will likely ignore it in{" "}
          <code>
            {"<"}channel{">"}
          </code>
        </>
      ),
      occurrences: tags.map((_, i) => ({ path: [...CHANNEL_PATH, [name, i]] })),
    },
  ];
}
