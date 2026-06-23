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
import { AnimatePresence, domMax, LazyMotion, m } from "motion/react";
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

	return (
		<LazyMotion features={domMax}>
			<div className="flex flex-col items-center justify-center gap-2 px-3 py-3">
				<div className="flex h-[125px] w-full flex-col items-center justify-center gap-3">
					<h1 className="text-center font-bold font-display text-5xl text-amber-950">
						Wild RSS
					</h1>
					<FeedSearchInput
						url={url}
						setURL={setURL}
						error={
							url.trim().length > 0 && !isProperURL ? "Bad URL" : undefined
						}
						loading={
							state === "fetching" || state === "parsing" || state === "testing"
						}
						onSubmit={validate}
					/>
				</div>
				<section className="mt-[120px] w-full max-w-5xl grow border-8 border-amber-950 bg-amber-50 text-red-950">
					<header className="border-amber-950 border-b-8 bg-amber-950 px-5 py-2 text-center font-bold font-display text-3xl text-amber-50">
						Report
					</header>
					<div className="flex flex-col gap-5 p-5">
						<AnimatePresence mode="popLayout">
							{hasResults && feedInfo?.title && feedInfo.image && (
								<m.div
									key={feedInfo.title}
									className="flex items-center gap-4 overflow-hidden border-4 border-amber-950 bg-amber-100 p-3"
									initial={{ opacity: 0, scale: 0.75 }}
									animate={{ opacity: 1, scale: 1 }}
								>
									<img
										src={feedInfo.image}
										alt="Feed artwork"
										className="hidden size-20 object-cover object-center sepia-[0.7] sm:flex"
										loading="lazy"
									/>
									<div className="flex flex-col font-display">
										<span className="font-bold text-2xl">{feedInfo.title}</span>
										{feedInfo.author && (
											<span className="text-lg">{feedInfo.author}</span>
										)}
									</div>
								</m.div>
							)}
						</AnimatePresence>

						<div className="flex flex-col gap-6">
							{TEST_GROUPS.map((group) => (
								<TestGroupDisplay
									key={group}
									results={results}
									tests={TESTS}
									group={group}
									xml={xml}
									state={state}
								/>
							))}
						</div>
					</div>
				</section>
			</div>
		</LazyMotion>
	);
}
