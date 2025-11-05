import clsx from "clsx";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { match } from "ts-pattern";
import type { XML } from "@/lib/feed";
import {
  type State,
  type Test,
  type TestResult,
  TestResultIcon,
} from "@/lib/tests/_index";
import { XmlPathPreview } from "./XMLPathPreview";

export function TestResultDisplay({
  xml,
  test,
  state,
  result,
}: {
  xml: XML | undefined;
  test: Test;
  state: State;
  result: TestResult | undefined;
}) {
  const status = result?.status;
  const bg = match(status)
    .with(undefined, () => "bg-amber-100")
    .with("passed", () => "bg-green-50")
    .with("failed", () => "bg-red-50")
    .with("running", () => "bg-blue-50")
    .exhaustive();

  return (
    <Disclosure
      className={clsx(
        "flex flex-col border-2 border-amber-950 px-3 py-2 data-[expanded=true]:gap-2",
        bg,
      )}
    >
      <Heading className="flex items-center gap-1.5">
        <TestResultIcon
          status={result?.status}
          size={24}
          weight="fill"
          className={clsx("flex-none", {
            "animate-spin": !result?.status && state !== "pending",
          })}
        />
        <span className="text-lg">{test.name}</span>
        {result?.status === "failed" && (
          <Button
            slot="trigger"
            className="ml-auto cursor-pointer py-1.5 text-red-800 text-sm underline"
          >
            Show error
          </Button>
        )}
      </Heading>
      <DisclosurePanel className="ml-6 flex flex-col gap-1">
        {result?.status === "failed" && (
          <>
            <span className="text-red-700">{result.error}</span>
            {xml && result.path && (
              <XmlPathPreview
                xml={xml}
                path={result.path}
                attribute={result.attribute}
              />
            )}
          </>
        )}
      </DisclosurePanel>
    </Disclosure>
  );
}
