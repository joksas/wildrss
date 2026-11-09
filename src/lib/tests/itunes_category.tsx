import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { CHANNEL_PATH, checkTag, type MinimalTestOutput } from "./_utils";
import { formatInteger } from "../number";

// Constants
const TAG = "itunes:category";
const MAX_CATEGORIES = 2;
const MAX_SUBCATEGORIES = 1;
const CATEGORIES = {
  "Arts": [
    "Books",
    "Design",
    "Fashion & Beauty",
    "Food",
    "Performing Arts",
    "Visual Arts",
  ],
  "Business": [
    "Careers",
    "Entrepreneurship",
    "Investing",
    "Management",
    "Marketing",
    "Non-Profit",
  ],
  "Comedy": ["Comedy Interviews", "Improv", "Stand-Up"],
  "Education": [
    "Courses",
    "How To",
    "Language Learning",
    "Self-Improvement",
  ],
  "Fiction": ["Comedy Fiction", "Drama", "Science Fiction"],
  "Government": [],
  "History": [],
  "Health & Fitness": [
    "Alternative Health",
    "Fitness",
    "Medicine",
    "Mental Health",
    "Nutrition",
    "Sexuality",
  ],
  "Kids & Family": [
    "Education for Kids",
    "Parenting",
    "Pets & Animals",
    "Stories for Kids",
  ],
  "Leisure": [
    "Animation & Manga",
    "Automotive",
    "Aviation",
    "Crafts",
    "Games",
    "Hobbies",
    "Home & Garden",
    "Video Games",
  ],
  "Music": ["Music Commentary", "Music History", "Music Interviews"],
  "News": [
    "Business News",
    "Daily News",
    "Entertainment News",
    "News Commentary",
    "Politics",
    "Sports News",
    "Tech News",
  ],
  "Religion & Spirituality": [
    "Buddhism",
    "Christianity",
    "Hinduism",
    "Islam",
    "Judaism",
    "Religion",
    "Spirituality",
  ],
  "Science": [
    "Astronomy",
    "Chemistry",
    "Earth Sciences",
    "Life Sciences",
    "Mathematics",
    "Natural Sciences",
    "Nature",
    "Physics",
    "Social Sciences",
  ],
  "Society & Culture": [
    "Documentary",
    "Personal Journals",
    "Philosophy",
    "Places & Travel",
    "Relationships",
  ],
  "Sports": [
    "Baseball",
    "Basketball",
    "Cricket",
    "Fantasy Sports",
    "Football",
    "Golf",
    "Hockey",
    "Rugby",
    "Running",
    "Soccer",
    "Swimming",
    "Tennis",
    "Volleyball",
    "Wilderness",
    "Wrestling",
  ],
  "Technology": [],
  "True Crime": [],
  "TV & Film": [
    "After Shows",
    "Film History",
    "Film Interviews",
    "Film Reviews",
    "TV Reviews",
  ],
} as const satisfies Record<string, readonly string[]>;
type Category = keyof typeof CATEGORIES;
const CATEGORY_NAMES = Object.keys(CATEGORIES) as Category[];

export default {
  key: TAG,
  group: "itunes",
  name: <code>&lt;itunes:category&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];
    const accepted: string[] = [];

    const categories = xml.rss?.at(0)?.channel?.at(0)?.[TAG];
    outputs.push(
      ...checkTag(categories, TAG, CHANNEL_PATH, {
        limits: { min: 1 },
        attributes: [
          {
            name: "text",
            type: "required",
            validator: ({ attributes }) => _checkCategory(attributes.text),
          },
        ],
        children: [{ name: TAG, min: 0 }],
      }),
      ..._checkSurplus(categories, CHANNEL_PATH, MAX_CATEGORIES, {
        message: (count) =>
          `Found ${formatInteger(count)} categories - Apple Podcasts uses the first ${formatInteger(MAX_CATEGORIES)} and ignores the rest, though other apps may use more`,
        note: (i) =>
          i === 0 ? "primary" : i === 1 ? "secondary" : "ignored",
      }),
    );

    for (let i = 0; i < (categories?.length ?? 0); i++) {
      const category = categories?.[i];
      const name = category?.["@attributes"]?.at(0)?.text;
      const path: Path = [...CHANNEL_PATH, [TAG, i]];
      const subcategories = category?.[TAG];
      const parent = _isCategory(name) ? name : undefined;

      outputs.push(
        ...checkTag(subcategories, TAG, path, {
          attributes: [
            {
              name: "text",
              type: "required",
              validator: ({ attributes }) =>
                parent ? _checkSubcategory(attributes.text, parent) : [],
            },
          ],
          children: [],
        }),
        ..._checkSurplus(subcategories, path, MAX_SUBCATEGORIES, {
          message: (count) =>
            `Found ${formatInteger(count)} subcategories - Apple Podcasts uses the first and ignores the rest, though other apps may use more`,
          note: (i) => (i === 0 ? "used" : "ignored"),
        }),
      );

      if (!parent) continue;
      const valid = (subcategories ?? [])
        .map((subcategory) => subcategory["@attributes"]?.at(0)?.text)
        .filter((name) => name !== undefined && _isSubcategory(name, parent));
      if (valid.length === 0) accepted.push(parent);
      for (const name of valid) accepted.push(`${parent} › ${name}`);
    }

    if (accepted.length > 0)
      outputs.push({
        status: "info",
        message: `Feed is categorized as ${accepted.join(", ")}`,
      });

    return outputs;
  },
} satisfies Test;

/** Validate a top-level category name against Apple's category list */
function _checkCategory(name: string | undefined): MinimalTestOutput[] {
  if (name === undefined || _isCategory(name)) return [];

  const differentCase = _findIgnoringCase(CATEGORY_NAMES, name);
  if (differentCase) return [_wrongCase(name, differentCase)];

  const parent = CATEGORY_NAMES.find((category) =>
    _findIgnoringCase(CATEGORIES[category], name),
  );
  if (parent)
    return [
      {
        status: "error",
        message: (
          <>
            <code>{name}</code> is a subcategory of <code>{parent}</code> - nest
            it inside{" "}
            <code>
              {"<"}
              {TAG} text="{parent}"{">"}
            </code>
          </>
        ),
      },
    ];

  return [_unrecognized(name, "category")];
}

/** Validate a subcategory name against the subcategories of its parent */
function _checkSubcategory(
  name: string | undefined,
  parent: Category,
): MinimalTestOutput[] {
  if (name === undefined || _isSubcategory(name, parent)) return [];

  const differentCase = _findIgnoringCase(CATEGORIES[parent], name);
  if (differentCase) return [_wrongCase(name, differentCase)];

  const owner = CATEGORY_NAMES.find((category) =>
    _findIgnoringCase(CATEGORIES[category], name),
  );
  if (owner)
    return [
      {
        status: "error",
        message: (
          <>
            <code>{name}</code> is a subcategory of <code>{owner}</code>, not{" "}
            <code>{parent}</code>
          </>
        ),
      },
    ];

  if (_findIgnoringCase(CATEGORY_NAMES, name))
    return [
      {
        status: "error",
        message: (
          <>
            <code>{name}</code> is a top-level category - list it as a separate{" "}
            <code>
              {"<"}
              {TAG}
              {">"}
            </code>{" "}
            in{" "}
            <code>
              {"<"}channel{">"}
            </code>
          </>
        ),
      },
    ];

  if (CATEGORIES[parent].length === 0)
    return [
      {
        status: "error",
        message: (
          <>
            <code>{parent}</code> has no subcategories
          </>
        ),
      },
    ];

  return [_unrecognized(name, `subcategory of ${parent}`)];
}

/** Warn about tags beyond the number that Apple Podcasts reads, noting the role of each tag */
function _checkSurplus(
  tags: XML[] | undefined,
  path: Path,
  max: number,
  text: { message: (count: number) => string; note: (index: number) => string },
): TestOutput[] {
  const count = tags?.length ?? 0;
  if (count <= max) return [];
  return [
    {
      status: "warn",
      message: text.message(count),
      occurrences: Array.from({ length: count }, (_, i) => ({
        path: [...path, [TAG, i]],
        note: text.note(i),
      })),
    },
  ];
}

function _isCategory(name: string | undefined): name is Category {
  return name !== undefined && Object.hasOwn(CATEGORIES, name);
}

function _isSubcategory(name: string, parent: Category): boolean {
  return (CATEGORIES[parent] as readonly string[]).includes(name);
}

function _findIgnoringCase(
  names: readonly string[],
  name: string,
): string | undefined {
  const normalized = name.trim().toLowerCase();
  return names.find((candidate) => candidate.toLowerCase() === normalized);
}

function _wrongCase(name: string, expected: string): MinimalTestOutput {
  return {
    status: "error",
    message: (
      <>
        Expected <code>{expected}</code> - found <code>{name}</code>. Apple
        Podcasts requires the exact spelling
      </>
    ),
  };
}

function _unrecognized(name: string, kind: string): MinimalTestOutput {
  return {
    status: "error",
    message: (
      <>
        <code>{name}</code> is not an Apple Podcasts {kind}
      </>
    ),
  };
}
