import type { XML } from "@/lib/feed";
import type { Occurrence, Path } from "@/lib/tests/_index";
import { formatInteger } from "@/lib/number";

/** XML source text with the character ranges to mark */
export type XmlExcerpt = {
	code: string;
	marks: [start: number, end: number][];
};

type ExcerptOptions = {
	attribute?: string;
	text?: boolean;
	limit?: number;
};

type PathNode = {
	tag: string;
	index: number;
	note?: string;
	children: Map<string, PathNode>;
};

type Part = string | { marked: string };

const INDENT = "  ";
const ITEM_TAGS = new Set(["item", "podcast:liveItem"]);
const ITEM_CONTEXT_TAGS = ["title", "guid"];
const TEXT_LIMIT = 120;
const CHILD_LIMIT = 5;

/** Render the elements at the given occurrences as one XML excerpt, printing shared ancestors once */
export function buildXmlExcerpt(
	root: XML,
	occurrences: Occurrence[],
	options: ExcerptOptions = {},
): XmlExcerpt {
	const { attribute, text, limit = occurrences.length } = options;
	const shown = occurrences.slice(0, limit);
	const omitted = occurrences.length - shown.length;
	const tree = _buildTree(shown);
	const anchorDepth =
		omitted > 0 ? _sharedPrefixLength(occurrences.map(({ path }) => path)) : -1;

	let code = "";
	const marks: XmlExcerpt["marks"] = [];

	function line(depth: number, parts: Part[]): void {
		code += INDENT.repeat(depth);
		for (const part of parts) {
			if (typeof part === "string") {
				code += part;
				continue;
			}
			marks.push([code.length, code.length + part.marked.length]);
			code += part.marked;
		}
		code += "\n";
	}

	function attributes(element: XML, isLeaf: boolean): Part[] {
		const record = element["@attributes"]?.[0] ?? {};
		const keys = Object.keys(record);
		const ordered =
			attribute && keys.includes(attribute)
				? [attribute, ...keys.filter((key) => key !== attribute)]
				: keys;
		return ordered.flatMap((key) => {
			const source = `${key}="${_escapeAttribute(record[key] ?? "")}"`;
			return isLeaf && key === attribute
				? [" ", { marked: source }]
				: ` ${source}`;
		});
	}

	/** Print a whole element with its descendants, marking it when it is the target */
	function whole(
		tag: string,
		element: XML,
		depth: number,
		isTarget: boolean,
	): void {
		const attrs = attributes(element, isTarget);
		const children = _childElements(element);
		const value = element["@text"]?.trim();
		if (children.length > 0) {
			line(depth, [`<${tag}`, ...attrs, ">"]);
			for (const [childTag, child] of children.slice(0, CHILD_LIMIT))
				whole(childTag, child, depth + 1, false);
			if (children.length > CHILD_LIMIT)
				line(depth + 1, [_omissionComment(children.length - CHILD_LIMIT)]);
			line(depth, [`</${tag}>`]);
		} else if (!value) line(depth, [`<${tag}`, ...attrs, " />"]);
		else {
			const content = _excerptText(value);
			const marked = isTarget && text;
			line(depth, [
				`<${tag}`,
				...attrs,
				">",
				marked ? { marked: content } : content,
				`</${tag}>`,
			]);
		}
	}

	function itemContext(element: XML, node: PathNode, depth: number): void {
		for (const tag of ITEM_CONTEXT_TAGS) {
			if ([...node.children.values()].some((child) => child.tag === tag))
				continue;
			const value = element[tag]?.at(0)?.["@text"];
			if (value) line(depth, [`<${tag}>`, _excerptText(value), `</${tag}>`]);
		}
	}

	function emit(
		parent: XML,
		node: PathNode,
		depth: number,
		onAnchorChain: boolean,
	): void {
		const element = parent[node.tag]?.at(node.index);
		const isLeaf = node.children.size === 0;
		if (!element) {
			if (isLeaf) line(depth, [{ marked: _absenceComment(node.tag) }]);
			return;
		}
		const isAnchor = onAnchorChain && depth === anchorDepth - 1;
		const isItem = ITEM_TAGS.has(node.tag);
		if (node.note) line(depth, [_comment(node.note)]);

		if (isLeaf && !isItem) {
			whole(node.tag, element, depth, true);
			return;
		}

		const hideAttributes = node.tag === "rss" && !isLeaf;
		line(depth, [
			`<${node.tag}`,
			...(hideAttributes ? [] : attributes(element, isLeaf)),
			">",
		]);
		if (isItem) itemContext(element, node, depth + 1);
		for (const child of node.children.values())
			emit(element, child, depth + 1, onAnchorChain && depth < anchorDepth - 1);
		if (isAnchor) line(depth + 1, [_omissionComment(omitted)]);
		line(depth, [`</${node.tag}>`]);
	}

	for (const node of tree.values()) emit(root, node, 0, true);
	if (anchorDepth === 0) line(0, [_omissionComment(omitted)]);
	return { code: code.trimEnd(), marks };
}

/** Merge occurrence paths into a tree keyed by tag and index, preserving first-seen order */
function _buildTree(occurrences: Occurrence[]): Map<string, PathNode> {
	const roots = new Map<string, PathNode>();
	for (const { path, note } of occurrences) {
		let level = roots;
		let node: PathNode | undefined;
		for (const [tag, index] of path) {
			const key = `${tag}#${index}`;
			node = level.get(key);
			if (!node) {
				node = { tag, index, children: new Map() };
				level.set(key, node);
			}
			level = node.children;
		}
		if (node && note) node.note = note;
	}
	return roots;
}

/** Number of leading segments shared by every path, leaving at least one distinct segment */
function _sharedPrefixLength(paths: Path[]): number {
	const [first, ...rest] = paths;
	let length = Math.min(...paths.map((path) => path.length)) - 1;
	for (const path of rest) {
		let shared = 0;
		while (
			shared < length &&
			path[shared][0] === first[shared][0] &&
			path[shared][1] === first[shared][1]
		)
			shared++;
		length = shared;
	}
	return length;
}

/** Child elements of an element as tag and element pairs, grouped by tag */
function _childElements(element: XML): [tag: string, child: XML][] {
	return Object.entries(element).flatMap(([tag, children]) =>
		tag === "@attributes" || tag === "@text" || !Array.isArray(children)
			? []
			: (children as XML[]).map((child): [string, XML] => [tag, child]),
	);
}

function _omissionComment(count: number): string {
	return _comment(`${formatInteger(count)} more`);
}

/** Placeholder for a tag the feed lacks, at the place it would go */
function _absenceComment(tag: string): string {
	return _comment(`no <${tag}> tag`);
}

function _comment(content: string): string {
	return `<!-- ${content} -->`;
}

/** Escaped text on one line, shortened to the first TEXT_LIMIT characters */
function _excerptText(value: string): string {
	const flat = value.replace(/\s+/g, " ");
	if (flat.length <= TEXT_LIMIT) return _escapeText(flat);
	return `${_escapeText(flat.slice(0, TEXT_LIMIT).trimEnd())}…`;
}

function _escapeAttribute(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function _escapeText(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
