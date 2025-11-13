import type { XML } from "../feed";
import type { Path, TestOutput } from "./_index";

export function checkTag(
  tags: XML[] | undefined,
  name: string,
  path: Path,
  options: {
    limits?: { min: number; max: number; pushOptional?: boolean };
    attributes?: { name: string; required: boolean }[];
    children?: { name: string; min: number; max?: number }[];
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
            {min === 1 ? "tag" : "tags"} - found {numTags}
          </span>
        ),
        path,
      });
    }
    if (numTags > max) {
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
            {max === 1 ? "tag" : "tags"} - found {numTags}
          </span>
        ),
        path,
      });
    }
    if (numTags === 0 && min === 0 && pushOptional) {
      outputs.push({
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
        path,
      });
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
        .filter((attr) => attr.required)
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

      // Allowed attributes
      const documentedAttributeNames = options.attributes.map(
        (attr) => attr.name,
      );
      for (const attribute of attributes) {
        const isDocumented = documentedAttributeNames.includes(attribute);
        if (!isDocumented)
          outputs.push({
            status: "warn",
            message: (
              <span>
                Unrecognized attribute <code>{attribute}</code> - most apps will
                likely ignore it
              </span>
            ),
            path: tagPath,
          });
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

        const matchingChildren =
          actualChildren.filter(([key]) => key === documentedName) ?? [];
        const numMatchingChildren = matchingChildren.length;

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
                {min === 1 ? "tag" : "tags"} - found {numMatchingChildren}
              </span>
            ),
            path: tagPath,
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
                {max === 1 ? "tag" : "tags"} - found {numMatchingChildren}
              </span>
            ),
            path: tagPath,
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
  }

  return outputs;
}
