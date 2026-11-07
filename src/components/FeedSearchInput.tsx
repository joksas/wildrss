import { useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useRef } from "react";
import {
	ComboBox,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";
import { prefetchFeed } from "@/lib/feed";
import { useRecentValidations } from "@/lib/recent";
import { ProgressCircle } from "./ProgressCircle";

/** Blur the focused element so the recent feeds popover closes */
function blurActiveElement() {
	(window.document.activeElement as HTMLElement | null)?.blur();
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

	const allFeedInfos = useRecentValidations();
	const filteredFeedInfos = allFeedInfos.filter((item) => {
		const urlLower = url.toLocaleLowerCase().trim();
		const itemURLLower = item.url.toLocaleLowerCase().trim();
		const itemTitleLower = item.title?.toLocaleLowerCase().trim();
		if (urlLower === itemURLLower) return false;
		if (itemURLLower.includes(urlLower)) return true;
		if (itemTitleLower?.includes(urlLower)) return true;
		return false;
	});
	const trigger = useRef<HTMLDivElement>(null);

	const submit = () => {
		blurActiveElement();
		onSubmit();
	};

	return (
		<ComboBox
			allowsCustomValue
			allowsEmptyCollection
			menuTrigger="focus"
			inputValue={url}
			onInputChange={setURL}
			aria-label="Feed URL"
			items={filteredFeedInfos}
			autoFocus
			className="w-full max-w-xl"
		>
			<div
				ref={trigger}
				className="border-ink bg-paper flex h-12 w-full items-center border-2 shadow-[0_2px_0_var(--color-rule)] transition-shadow duration-150 ease-out has-[input:focus]:shadow-[0_2px_0_var(--color-rule),0_0_0_4px_#f0c97cb3]"
			>
				<Input
					type="url"
					placeholder="Paste a feed URL"
					className="text-ink placeholder:text-ink-muted/70 h-full min-w-0 grow bg-transparent px-3.5 text-[17px] outline-none"
					required
					onKeyDown={(e) => {
						if (e.key !== "Enter") return;
						submit();
					}}
				/>
				{error && (
					<span className="text-fail flex-none px-2 text-sm">{error}</span>
				)}
				<button
					type="button"
					onClick={submit}
					aria-busy={loading}
					className="bg-ink text-paper pointer-fine:hover:bg-ink/90 m-1 grid h-[calc(100%-0.5rem)] flex-none place-items-center px-4 text-[15px] font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
				>
					<span
						className={`col-start-1 row-start-1 ${loading ? "invisible" : ""}`}
					>
						Validate
					</span>
					{loading && (
						<ProgressCircle size={18} className="col-start-1 row-start-1" />
					)}
				</button>
			</div>
			<Popover
				placement="bottom start"
				offset={6}
				triggerRef={trigger}
				className="w-[min(36rem,calc(100vw-2rem))] origin-top transition-[opacity,transform] duration-150 ease-(--ease-out-strong) data-exiting:opacity-0 data-exiting:duration-100 starting:-translate-y-1 starting:opacity-0"
			>
				{filteredFeedInfos.length > 0 && (
					<div className="paper-surface border-ink text-ink flex flex-col border-2 shadow-[0_12px_32px_-12px_#5a2e1280]">
						<ListBox
							aria-label="Recent feeds"
							items={filteredFeedInfos}
							className="flex flex-col py-1.5"
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
									className="data-focused:bg-paper-deep data-hovered:bg-paper-deep flex cursor-pointer items-center gap-3 px-3.5 py-2 outline-none"
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
										<span className="truncate text-[15px] leading-tight font-medium">
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
				)}
			</Popover>
		</ComboBox>
	);
}
