import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import {
  CHANNEL_PATH,
  checkHypertextURL,
  checkTag,
  getParents,
  type MinimalTestOutput,
  mergeRepeatedOutputs,
  optionalTagAbsent,
} from "./_utils";

// Constants
const DEFAULT_ROLE = "host";
const DEFAULT_GROUP = "cast";
const MAX_NAME_LENGTH = 128;
const TAXONOMY = {
  "creative direction": [
    "director",
    "assistant director",
    "executive producer",
    "senior producer",
    "producer",
    "associate producer",
    "development producer",
    "creative director",
  ],
  "cast": [
    "host",
    "co-host",
    "guest host",
    "guest",
    "voice actor",
    "narrator",
    "announcer",
    "reporter",
  ],
  "writing": [
    "author",
    "editorial director",
    "co-writer",
    "writer",
    "songwriter",
    "guest writer",
    "story editor",
    "managing editor",
    "script editor",
    "script coordinator",
    "researcher",
    "editor",
    "fact checker",
    "translator",
    "transcriber",
    "logger",
  ],
  "audio production": [
    "studio coordinator",
    "technical director",
    "technical manager",
    "audio engineer",
    "remote recording engineer",
    "post production engineer",
  ],
  "audio post-production": [
    "audio editor",
    "sound designer",
    "foley artist",
    "composer",
    "theme music",
    "music production",
    "music contributor",
  ],
  "administration": [
    "production coordinator",
    "booking coordinator",
    "production assistant",
    "content manager",
    "marketing manager",
    "sales representative",
    "sales manager",
  ],
  "visuals": [
    "graphic designer",
    "cover art designer",
  ],
  "community": [
    "social media manager",
  ],
  "misc.": [
    "consultant",
    "intern",
  ],
  "video production": [
    "camera operator",
    "lighting designer",
    "camera grip",
    "assistant camera",
  ],
  "video post-production": [
    "editor",
    "assistant editor",
  ],
} as const satisfies Record<string, readonly string[]>;
type Group = keyof typeof TAXONOMY;

export default {
  key: "podcast:person",
  group: "podcast",
  name: <code>&lt;podcast:person&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const parents = getParents(xml, ["channel", "item", "podcast:liveItem"]);
    let numPeople = 0;
    for (const { tag, path } of parents) {
      const people = tag["podcast:person"];
      numPeople += people?.length ?? 0;
      outputs.push(..._checkPeople(people, path));
    }

    if (numPeople === 0)
      return [optionalTagAbsent("podcast:person", CHANNEL_PATH)];

    outputs.push(..._checkHostsRestated(parents));
    outputs.push({
      status: "info",
      message: (
        <>
          Found {numPeople}{" "}
          <code>
            {"<"}podcast:person{">"}
          </code>{" "}
          {numPeople === 1 ? "tag" : "tags"}
        </>
      ),
    });

    return mergeRepeatedOutputs(outputs);
  },
} satisfies Test;

function _checkPeople(people: XML[] | undefined, path: Path): TestOutput[] {
  return checkTag(people, "podcast:person", path, {
    attributes: [
      {
        name: "role",
        type: "optional",
        validator: ({ attributes }) =>
          _checkRole(attributes.role, attributes.group),
      },
      {
        name: "group",
        type: "optional",
        validator: ({ attributes }) => _checkGroup(attributes.group),
      },
      {
        name: "img",
        type: "optional",
        validator: ({ attributes }) => checkHypertextURL(attributes.img),
      },
      {
        name: "href",
        type: "optional",
        validator: ({ attributes }) => checkHypertextURL(attributes.href),
      },
    ],
    children: [],
    text: { validator: ({ text }) => _checkName(text) },
  });
}

function _checkName(text: string | undefined): MinimalTestOutput[] {
  const name = text?.trim() ?? "";
  if (name === "")
    return [{ status: "error", message: "Name cannot be blank" }];
  if (name.length > MAX_NAME_LENGTH)
    return [
      {
        status: "warn",
        message: `Name should not exceed ${MAX_NAME_LENGTH} characters or aggregators may truncate it - found ${name.length}`,
      },
    ];
  return [];
}

function _checkGroup(value: string | undefined): MinimalTestOutput[] {
  if (value === undefined || _isGroup(_normalize(value))) return [];
  return [
    {
      status: "warn",
      message: (
        <>
          Unknown group <code>{value}</code> - expected one of the Podcast
          Taxonomy groups: <code>{Object.keys(TAXONOMY).join(", ")}</code>
        </>
      ),
    },
  ];
}

function _checkRole(
  roleValue: string | undefined,
  groupValue: string | undefined,
): MinimalTestOutput[] {
  const role = _normalize(roleValue ?? DEFAULT_ROLE);
  const group = _normalize(groupValue ?? DEFAULT_GROUP);
  const groupsWithRole = _groupsWithRole(role);

  if (groupsWithRole.length === 0)
    return [
      {
        status: "warn",
        message: (
          <>
            Unknown role <code>{roleValue}</code> - expected a role from the
            Podcast Taxonomy, such as <code>host</code>, <code>guest</code> or{" "}
            <code>producer</code>
          </>
        ),
      },
    ];
  if (!_isGroup(group) || groupsWithRole.includes(group)) return [];

  return [
    {
      status: "warn",
      message: (
        <>
          Role <code>{roleValue ?? DEFAULT_ROLE}</code> is not in group{" "}
          <code>{groupValue ?? DEFAULT_GROUP}</code>
          {groupValue === undefined && " (the default when group is omitted)"}{" "}
          - expected <code>group="{groupsWithRole.join('" or "')}"</code>
        </>
      ),
    },
  ];
}

/** Warn when an episode lists people but no host, since its people replace the channel's */
function _checkHostsRestated(
  parents: ReturnType<typeof getParents>,
): TestOutput[] {
  const channel = parents.find(({ level }) => level === "channel");
  if (!_hasHost(channel?.tag["podcast:person"])) return [];

  const outputs: TestOutput[] = [];
  for (const { level, tag, path } of parents) {
    const people = tag["podcast:person"];
    if (level === "channel" || !people || _hasHost(people)) continue;
    outputs.push({
      status: "warn",
      message: (
        <>
          Episode lists people but no host. People in an episode replace the
          channel's people, so apps will show no host for this episode
        </>
      ),
      path,
    });
  }
  return outputs;
}

function _hasHost(people: XML[] | undefined): boolean {
  return (people ?? []).some((person) => {
    const attributes = person["@attributes"]?.[0] ?? {};
    return _normalize(attributes.role ?? DEFAULT_ROLE) === DEFAULT_ROLE;
  });
}

function _normalize(value: string): string {
  return value.trim().toLowerCase();
}

function _isGroup(group: string): group is Group {
  return Object.hasOwn(TAXONOMY, group);
}

function _groupsWithRole(role: string): Group[] {
  return (Object.keys(TAXONOMY) as Group[]).filter((group) =>
    (TAXONOMY[group] as readonly string[]).includes(role),
  );
}
