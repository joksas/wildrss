import { useQueryClient } from "@tanstack/react-query";
import {
	TEST_GROUPS,
	type Test,
	type TestOutput,
	type ValidationState,
} from "@tests/_index";
import testCORS from "@tests/cors";
import testDescription from "@tests/description";
import testFetching from "@tests/fetching";
import testItunesExplicit from "@tests/itunes_explicit";
import testItunesImage from "@tests/itunes_image";
import testItunesOwner from "@tests/itunes_owner";
import testLink from "@tests/link";
import testPodcastChat from "@tests/podcast_chat";
import testPodcastGuid from "@tests/podcast_guid";
import testPodcastLiveItem from "@tests/podcast_live_item";
import testPodcastValue from "@tests/podcast_value";
import testRSSEnclosure from "@tests/rss_enclosure";
import testRSSGUID from "@tests/rss_guid";
import testTitle from "@tests/title";
import { Result, ResultAsync } from "neverthrow";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { useDocumentTitle } from "usehooks-ts";
import * as z from "zod";
import { en } from "zod/locales";
import { TestGroupDisplay } from "@/components/TestGroupDisplay";
import {
	cancelFeedQueries,
	fetchFeed,
	parseFeed,
	prefetchFeed,
	type XML,
} from "@/lib/feed";
import { useRecentValidations, useUpsertRecentValidation } from "@/lib/recent";
import { WEBSITE_NAME } from "@/lib/site";
import { isWebURL } from "@/lib/url";
import { FeedSearchInput } from "./FeedSearchInput";

z.config(en());

// Constants
const TESTS: Test[] = [
	testFetching,
	testCORS,

	testTitle,
	testDescription,
	testRSSEnclosure,
	testRSSGUID,
	testLink,

	testItunesExplicit,
	testItunesImage,
	testItunesOwner,

	testPodcastGuid,
	testPodcastValue,
	testPodcastLiveItem,
	testPodcastChat,
];

export function HomePage() {
	const client = useQueryClient();

	// State
	const [url, setURL] = useQueryState("url", {
		defaultValue: "",
		parse: (raw: string | null) => (raw ? decodeURIComponent(raw) : ""),
		serialize: (value: string) => encodeURIComponent(value),
	});
	const isProperURL = isWebURL(url);
	// Start in the loading state when the page loads with a feed URL already in
	// the query string, so the server-rendered HTML shows progress immediately
	// instead of flashing the idle state before validation kicks in.
	const [state, setState] = useState<ValidationState>(
		isProperURL ? "fetching" : "pending",
	);
	const [xml, setXML] = useState<XML | undefined>(undefined);
	const [results, setResults] = useState<Record<string, TestOutput[]>>({});
	const hasResults = Object.entries(results).length > 0;
	const recentValidations = useRecentValidations();
	const feedInfo = recentValidations.find(
		(validation) => validation.url.trim() === url.trim(),
	);
	const upsertRecentValidation = useUpsertRecentValidation();

	useEffect(() => {
		if (!isProperURL) return;
		cancelFeedQueries(client).then(() => prefetchFeed(client, url));
	}, [client, url, isProperURL]);
	useEffect(() => setResults({}), [url]);

	const validating = useRef(false);
	const validate = async (targetURL: string = url) => {
		if (!isWebURL(targetURL) || validating.current) return;
		validating.current = true;
		try {
			setResults({});
			setXML(undefined);

			// Fetch
			setState("fetching");
			await new Promise((resolve) => setTimeout(resolve, 1));
			const fetchRes = await ResultAsync.fromPromise(
				fetchFeed(client, targetURL),
				(e) => e,
			);
			if (fetchRes.isErr()) {
				setResults({
					[testFetching.key]: [
						{ status: "error", message: "Failed to download" },
					],
				});
				setState("pending");
				return;
			}

			// Parse
			setState("parsing");
			const { content, time_ms: fetching_time_ms, headers } = fetchRes.value;
			const parseRes = Result.fromThrowable(parseFeed)(content);
			if (parseRes.isErr()) {
				setResults({
					[testFetching.key]: [
						{
							status: "error",
							message: "This does not look like an RSS feed",
						},
					],
				});
				setState("pending");
				return;
			}
			const _xml = parseRes.value;
			setXML(_xml);
			upsertRecentValidation({
				url: targetURL,
				title: _xml.rss?.at(0)?.channel?.at(0)?.title?.at(0)?.["@text"],
				author: _xml.rss?.at(0)?.channel?.at(0)?.["itunes:author"]?.at(0)?.[
					"@text"
				],
				image: _xml.rss?.at(0)?.channel?.at(0)?.["itunes:image"]?.at(0)?.[
					"@attributes"
				][0].href,
				updated: new Date().toISOString(),
			});

			// Run tests
			setState("testing");
			const allResults: Record<string, TestOutput[]> = {};

			await Promise.all(
				TESTS.map(async (test) => {
					allResults[test.key] = await test.test({
						xml: _xml,
						fetching_info: {
							success: true,
							time_ms: fetching_time_ms,
							headers,
						},
					});
				}),
			);

			setResults(allResults);
			setState("pending");
		} catch (error) {
			console.error("ERROR", error);
		} finally {
			validating.current = false;
		}
	};

	// Validate on load
	useEffect(() => {
		if (!isProperURL) return;
		validate();
	}, []);

	// HTML Title
	useDocumentTitle(
		feedInfo?.title ? `${feedInfo.title} - ${WEBSITE_NAME}` : WEBSITE_NAME,
	);

	const loading =
		state === "fetching" || state === "parsing" || state === "testing";

	return (
		<div className="flex flex-col items-center px-4 pt-7 pb-20 sm:pt-9">
			<header className="flex w-full flex-col items-center gap-5">
				<h1 className="font-display text-ink text-center text-5xl [text-shadow:0_1px_0_#fbe3bf] sm:text-6xl">
					Wild RSS
				</h1>
				<FeedSearchInput
					url={url}
					setURL={setURL}
					error={
						url.trim().length > 0 && !isProperURL ? "Not a URL" : undefined
					}
					loading={loading}
					onSubmit={validate}
				/>
			</header>

			<section
				aria-busy={loading}
				className="paper-surface border-ink relative mt-[136px] w-full max-w-4xl border-[3px] shadow-[0_28px_60px_-24px_#5a2e1299]"
			>
				<div className="border-ink pointer-events-none absolute inset-[5px] border" />
				<div className="relative flex flex-col gap-10 px-5 pt-9 pb-10 sm:px-12 sm:pt-11">
					{hasResults && feedInfo?.title && (
						<div
							key={feedInfo.url}
							className="masthead-reveal flex items-center gap-5"
						>
							{feedInfo.image && (
								<div className="border-ink size-16 flex-none border sm:size-20">
									<img
										src={feedInfo.image}
										alt=""
										className="size-full object-cover object-center sepia-[0.6]"
										loading="lazy"
									/>
								</div>
							)}
							<div className="flex min-w-0 flex-col gap-1">
								<h2 className="font-serif text-2xl leading-tight font-bold sm:text-[28px]">
									{feedInfo.title}
								</h2>
								{feedInfo.author && (
									<span className="text-ink-muted text-[15px]">
										{feedInfo.author}
									</span>
								)}
							</div>
						</div>
					)}

					<div className="flex flex-col gap-10">
						{TEST_GROUPS.map((group) => (
							<TestGroupDisplay
								key={group}
								results={results}
								tests={TESTS}
								group={group}
								xml={xml}
								state={state}
								startIndex={TESTS.findIndex((test) => test.group === group)}
							/>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
