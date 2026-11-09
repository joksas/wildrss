import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import {
	Button,
	ComboBox,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";
import { prefetchFeed } from "@/lib/feed";
import { type FeedInfo, useRecentValidations } from "@/lib/recent";
import { ProgressCircle } from "./ProgressCircle";

/** Blur the focused element so the recent feeds popover closes */
function blurActiveElement() {
	(window.document.activeElement as HTMLElement | null)?.blur();
}

/** Recent feeds whose URL or title contains the query, excluding an exact URL match */
function filterFeedInfos(feedInfos: FeedInfo[], query: string): FeedInfo[] {
	const queryLower = query.toLocaleLowerCase().trim();
	return feedInfos.filter((item) => {
		const itemURLLower = item.url.toLocaleLowerCase().trim();
		const itemTitleLower = item.title?.toLocaleLowerCase().trim();
		if (queryLower === itemURLLower) return false;
		if (itemURLLower.includes(queryLower)) return true;
		if (itemTitleLower?.includes(queryLower)) return true;
		return false;
	});
}

export function FeedSearchInput({
	url,
	setURL,
	error,
	loading,
	onSubmit,
}: {
	url: string;
	setURL: Dispatch<SetStateAction<string>>;
	error?: string;
	loading?: boolean;
	onSubmit: (targetURL?: string) => Promise<void>;
}) {
	const client = useQueryClient();
	const onHover = (prefetchURL: string) => prefetchFeed(client, prefetchURL);

	// The full history shows on focus or button press; typing narrows it
	const [filtering, setFiltering] = useState(false);
	const allFeedInfos = useRecentValidations();
	const feedInfos = filtering
		? filterFeedInfos(allFeedInfos, url)
		: allFeedInfos;
	const trigger = useRef<HTMLDivElement>(null);

	const submit = () => {
		blurActiveElement();
		onSubmit();
	};

	return (
		<ComboBox
			allowsCustomValue
			menuTrigger="focus"
			inputValue={url}
			onInputChange={(value) => {
				setFiltering(true);
				setURL(value);
			}}
			onOpenChange={(isOpen, menuTrigger) => {
				if (isOpen) setFiltering(menuTrigger === "input");
			}}
			aria-label="Feed URL"
			items={feedInfos}
			autoFocus={url.length === 0}
			className="group w-full max-w-xl"
		>
			<div
				ref={trigger}
				className="border-ink bg-paper flex h-12 w-full items-center border-2 shadow-[0_2px_0_var(--color-rule)] transition-shadow duration-150 ease-out has-[input:focus]:shadow-[0_2px_0_var(--color-rule),0_0_0_4px_#f0c97cb3]"
			>
				<Input
					type="url"
					enterKeyHint="go"
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
					placeholder="Paste a feed URL"
					className="text-ink placeholder:text-ink-muted/70 h-full min-w-0 grow bg-transparent px-3.5 text-base outline-none"
					required
					onKeyDown={(e) => {
						if (e.key !== "Enter") return;
						submit();
					}}
				/>
				{error && (
					<span className="text-fail flex-none px-2 text-sm">{error}</span>
				)}
				{allFeedInfos.length > 0 && (
					<Button
						aria-label="Recent feeds"
						className="text-ink-muted pointer-fine:data-hovered:bg-paper-deep pointer-fine:data-hovered:text-ink data-pressed:bg-paper-deep group-data-open:bg-paper-deep group-data-open:text-ink grid h-[calc(100%-0.5rem)] flex-none place-items-center px-2.5 transition-colors duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-offset-0"
					>
						<ClockCounterClockwiseIcon aria-hidden size={20} weight="bold" />
					</Button>
				)}
				<Button
					onPress={submit}
					isPending={loading}
					className="bg-ink text-paper pointer-fine:data-hovered:bg-ink/90 m-1 grid h-[calc(100%-0.5rem)] flex-none place-items-center px-4 text-sm font-medium transition-[transform,background-color] duration-150 ease-(--ease-out-strong) data-pressed:scale-[0.97]"
				>
					<span
						className={`col-start-1 row-start-1 ${loading ? "invisible" : ""}`}
					>
						Validate
					</span>
					{loading && (
						<ProgressCircle
							size={16}
							label="Validating"
							className="col-start-1 row-start-1"
						/>
					)}
				</Button>
			</div>
			<Popover
				placement="bottom start"
				offset={6}
				triggerRef={trigger}
				className="w-[min(36rem,calc(100vw-2rem))] origin-top transition-[opacity,transform] duration-150 ease-(--ease-out-strong) data-exiting:opacity-0 data-exiting:duration-100 starting:-translate-y-1 starting:opacity-0"
			>
				<div className="paper-surface border-ink text-ink flex max-h-[inherit] flex-col border-2 shadow-[0_12px_32px_-12px_#5a2e1280]">
					<ListBox
						aria-label="Recent feeds"
						items={feedInfos}
						className="flex min-h-0 flex-col overflow-y-auto overscroll-contain py-1.5"
					>
						{(info) => (
							<ListBoxItem
								onHoverStart={() => onHover(info.url)}
								id={info.url}
								key={info.url}
								onAction={() => {
									setURL(info.url);
									blurActiveElement();
									onSubmit(info.url);
								}}
								className="data-focused:bg-paper-deep data-hovered:bg-paper-deep data-pressed:bg-paper-deep flex cursor-pointer items-center gap-3 px-3.5 py-2 outline-none"
								textValue={info.title ?? info.url}
							>
								{info.image ? (
									<img
										src={info.image}
										alt=""
										className="border-rule size-9 flex-none border object-cover object-center sepia-[0.6]"
										loading="lazy"
									/>
								) : (
									<span className="border-rule bg-paper-deep size-9 flex-none border" />
								)}
								<span className="flex min-w-0 flex-col gap-0.5">
									<span className="truncate text-sm leading-tight font-medium">
										{info.title ?? info.url}
									</span>
									<span className="text-ink-muted truncate text-xs leading-tight">
										{info.url}
									</span>
								</span>
							</ListBoxItem>
						)}
					</ListBox>
				</div>
			</Popover>
		</ComboBox>
	);
}
