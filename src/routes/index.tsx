import { createFileRoute } from "@tanstack/react-router";
import { XMLParser } from "fast-xml-parser";

export const Route = createFileRoute("/")({ component: App });

const url = "https://feeds.fountain.fm/XFlRiU4hNCUBSuXmzYeu";

function App() {
  const parseFeed = async () => {
    const content = await (await fetch(url)).text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const obj = parser.parse(content);
    console.log(obj);
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-5">
      <h1 className="font-bold text-2xl">Homepage</h1>
      <button
        className="w-fit cursor-pointer border border-sky-950 bg-sky-100 px-3 py-2 font-bold text-sky-950"
        type="button"
        onClick={parseFeed}
      >
        Validate feed
      </button>
    </div>
  );
}
