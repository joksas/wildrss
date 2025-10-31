import { createFileRoute } from "@tanstack/react-router";
import { XMLParser } from "fast-xml-parser";
import { useTransition } from "react";

export const Route = createFileRoute("/")({ component: App });

const URL = "https://feeds.fountain.fm/XFlRiU4hNCUBSuXmzYeu";
const TESTS: ({
  name: string,
  test: (
    xml: any,
  ) => { error?: undefined } | { error: string; path: string[] }
})[] = [
    {
      name: 'Valid title tag',
      test: (xml) => {
        const title_node = xml.rss.channel.title;
        if (!title_node)
          return { error: "Missing <title>", path: ["rss", "channel"] };
        const title = title_node['#text'];
        if (!title) return { error: 'Missing <title> value', path: ["rss", "channel", "title"] }
        return {};
      },
    }
];

function App() {
  const [parsing, startParsing] = useTransition();
  const parseFeed = () =>
    startParsing(async () => {
      const content = await (await fetch(URL)).text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        alwaysCreateTextNode: true,
        transformTagName: (name) => name.toLocaleLowerCase(),
        transformAttributeName: (name) => name.toLocaleLowerCase(),
      });
      const xml = parser.parse(content);
      const title = xml.rss.channel.title["#text"];
      const description = xml.rss.channel.description["#text"];
      const item_guid = xml.rss.channel.item[0].guid["#text"];
      console.log(JSON.stringify(xml), title, description, item_guid);
    });

  return (
    <div className="flex flex-col gap-2 px-3 py-5">
      <h1 className="font-bold text-2xl">Homepage</h1>
      <button
        className="w-fit cursor-pointer border border-sky-950 bg-sky-100 px-3 py-2 font-bold text-sky-950"
        type="button"
        onClick={parseFeed}
      >
        {parsing ? "Parsing..." : "Validate feed"}

      </button>
      <ul className="list-disc list-inside">
        {TESTS.map((test) => (<li>{test.name}</li>))}
      </ul>
    </div>
  );
}
