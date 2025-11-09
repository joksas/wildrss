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
  type Test,
  type TestOutput,
  TestResultIcon,
  type ValidationState,
} from "@/lib/tests/_index";
import { XmlPathPreview } from "./XMLPathPreview";

export function TestResultDisplay({
  xml,
  test,
  state,
  results,
}: {
  xml: XML | undefined;
  test: Test;
  state: ValidationState;
  results: TestOutput[] | undefined;
}) {
  const status = results
    ? results.find(
        (output) => output.status === "error" || output.status === "warn",
      )
      ? "failed"
      : "passed"
    : undefined;
  const bg = match(status)
    .with(undefined, () => "bg-amber-100")
    .with("passed", () => "bg-green-50")
    .with("failed", () => "bg-red-50")
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
          status={status}
          size={24}
          weight="fill"
          className={clsx("flex-none", {
            "animate-spin": !status && state !== "pending",
          })}
        />
        <span className="text-lg">{test.name}</span>
        {status === "failed" && (
          <Button
            slot="trigger"
            className="ml-auto cursor-pointer py-1.5 text-red-800 text-sm underline"
          >
            Show error
          </Button>
        )}
      </Heading>
      <DisclosurePanel className="ml-6 flex flex-col gap-1">
        {results
          ?.filter(
            (output) => output.status === "error" || output.status === "warn",
          )
          .sort((a, b) => {
            if (a.status === b.status) return 0;
            if (a.status === "error") return -1;
            return 1;
          })
          .map((output) => (
            <>
              <span className="text-red-700">{output.message}</span>
              {xml && output.path && (
                <XmlPathPreview
                  xml={xml}
                  path={output.path}
                  attribute={output.attribute}
                  text={output.text}
                />
              )}
            </>
          ))}
      </DisclosurePanel>
    </Disclosure>
  );
}
