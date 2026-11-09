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
import type { Occurrence } from "@/lib/tests/_index";
import { buildXmlExcerpt } from "@/lib/xml_excerpt";
import { formatInteger } from "@/lib/number";

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

	const nodes = useMemo(() => {
		const excerpt = buildXmlExcerpt(xml, occurrences, {
			attribute,
			text,
			limit: expanded ? undefined : COLLAPSED_LIMIT,
		});
		const { tokens } = highlighter.tokenize(excerpt.code, { lang: "xml" });
		return renderTokens(tokens, {
			decorations: excerpt.marks.map((range) => ({
				range,
				className: "xml-mark",
			})),
		});
	}, [xml, occurrences, attribute, text, expanded]);

	return (
		<div className={twMerge("border-rule bg-paper-deep/50 border", className)}>
			<pre
				className={`overflow-auto overscroll-x-contain px-3 py-2.5 font-mono text-[13px] leading-relaxed ${expanded ? "max-h-128" : ""}`}
			>
				<code>{nodes.map(_renderNode)}</code>
			</pre>
			{collapsible && (
				<Button
					onPress={() => setExpanded((value) => !value)}
					className="border-rule text-ink-muted pointer-fine:data-hovered:bg-paper-deep pointer-fine:data-hovered:text-ink data-pressed:bg-paper-deep focus-visible:bg-paper-deep flex w-full cursor-pointer items-center gap-1.5 border-t px-3 py-1.5 text-left text-sm transition-colors duration-150 ease-out outline-none pointer-coarse:py-3"
				>
					<CaretDownIcon
						aria-hidden
						size={12}
						weight="bold"
						className={`transition-transform duration-200 ease-(--ease-out-strong) ${expanded ? "rotate-180" : ""}`}
					/>
					{expanded
						? `Show first ${formatInteger(COLLAPSED_LIMIT)}`
						: `Show all ${formatInteger(occurrences.length)}`}
				</Button>
			)}
		</div>
	);
}

function _renderNode(node: HighlightRenderNode, index: number): ReactNode {
	if (node.type === "text") return node.value;
	return (
		<span key={index} className={node.classNames.join(" ")}>
			{node.children.map(_renderNode)}
		</span>
	);
}
