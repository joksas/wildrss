import { CaretDownIcon } from "@phosphor-icons/react";
import {
	createHighlighter,
	type HighlightRenderNode,
	renderTokens,
} from "@tanstack/highlight/core";
import { html } from "@tanstack/highlight/languages/html";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "react-aria-components";
import { twMerge } from "tailwind-merge";
import type { XML } from "@/lib/feed";
import { formatInteger } from "@/lib/number";
import type { Occurrence } from "@/lib/tests/_index";
import { buildXmlExcerpt, type XmlExcerpt } from "@/lib/xml_excerpt";

const highlighter = createHighlighter({ languages: [html] });

/** Occurrences shown before the excerpt is expanded */
const COLLAPSED_LIMIT = 3;

/** Highlighted XML excerpt of the feed elements at the given occurrences */
export function XmlPathPreview({
	xml,
	occurrences,
	attribute,
	text,
	className,
}: {
	xml: XML;
	occurrences: Occurrence[];
	attribute?: string;
	text?: boolean;
	className?: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const collapsible = occurrences.length > COLLAPSED_LIMIT;

	const lines = useMemo(() => {
		const excerpt = buildXmlExcerpt(xml, occurrences, {
			attribute,
			text,
			limit: expanded ? undefined : COLLAPSED_LIMIT,
		});
		return _renderLines(excerpt);
	}, [xml, occurrences, attribute, text, expanded]);

	return (
		<div className={twMerge("border-rule bg-paper-deep/50 border", className)}>
			<pre
				className={`overflow-y-auto px-3 py-2.5 font-mono text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap ${expanded ? "max-h-128" : ""}`}
			>
				<code>
					{lines.map(({ indent, nodes }, i) => (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: lines have no stable identity
							key={i}
							className="block -indent-[2ch]"
							style={{ paddingInlineStart: `${indent + 2}ch` }}
						>
							{nodes.map(_renderNode)}
						</span>
					))}
				</code>
			</pre>
			{collapsible && (
				<Button
					onPress={() => setExpanded((value) => !value)}
					className="border-rule text-ink-muted pointer-fine:data-hovered:bg-paper-deep pointer-fine:data-hovered:text-ink data-pressed:bg-paper-deep focus-visible:bg-paper-deep flex w-full cursor-pointer items-center gap-1.5 border-t px-3 py-1.5 text-left text-sm transition-colors duration-150 ease-out outline-none pointer-coarse:py-3"
				>
					<CaretDownIcon
						aria-hidden
						size={14}
						weight="bold"
						className={`transition-transform duration-200 ease-(--ease-out-strong) ${expanded ? "rotate-180" : ""}`}
					/>
					{expanded
						? `Show first ${formatInteger(COLLAPSED_LIMIT)}`
						: `Show all ${formatInteger(occurrences.length)} tags`}
				</Button>
			)}
		</div>
	);
}

/** Highlight each excerpt line on its own so wrapped lines can hang under their indentation */
function _renderLines(
	excerpt: XmlExcerpt,
): { indent: number; nodes: HighlightRenderNode[] }[] {
	let lineStart = 0;
	return excerpt.code.split("\n").map((source) => {
		const indent = source.length - source.trimStart().length;
		const contentStart = lineStart + indent;
		const content = source.slice(indent);
		lineStart += source.length + 1;
		const decorations = excerpt.marks.flatMap(([start, end]) => {
			const from = Math.max(start, contentStart) - contentStart;
			const to = Math.min(end, contentStart + content.length) - contentStart;
			return from < to
				? [{ range: [from, to] as const, className: "xml-mark" }]
				: [];
		});
		const { tokens } = highlighter.tokenize(content, { lang: "xml" });
		return { indent, nodes: renderTokens(tokens, { decorations }) };
	});
}

function _renderNode(node: HighlightRenderNode, index: number): ReactNode {
	if (node.type === "text") return node.value;
	return (
		<span key={index} className={node.classNames.join(" ")}>
			{node.children.map(_renderNode)}
		</span>
	);
}
