import clsx from "clsx";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import * as z from "zod";
import type { XML } from "@/lib/feed";
import type { Test, TestOutput, ValidationState } from "@/lib/tests/_index";
import { TestOutputIcon } from "./TestOutputIcon";
import { TestOutputsGroup } from "./TestOutputsGroup";
import { TestResultIcon } from "./TestResultIcon";
import { XmlPathPreview } from "./XMLPathPreview";

export function TestResultDisplay({
  xml,
  test,
  state,
  outputs: results,
}: {
  xml: XML | undefined;
  test: Test;
  state: ValidationState;
  outputs: TestOutput[] | undefined;
}) {
  // Number of results
  const num_total = results?.length ?? 0;
  const expandable = num_total > 0;

  return (
    <Disclosure
      className={clsx(
        "flex flex-col border-2 border-amber-950 bg-amber-100 data-[expanded=true]:gap-2",
      )}
    >
      <Heading>
        <Button
          className={clsx(
            "flex w-full items-center justify-between gap-1.5 py-2 pr-4 pl-3",
            {
              "cursor-pointer": expandable,
            },
          )}
          slot={expandable ? "trigger" : undefined}
        >
          <div className="flex items-center gap-1.5">
            <TestResultIcon
              outputs={results}
              size={24}
              className={clsx({
                "animate-spin": !results && state !== "pending",
              })}
            />
            <span className="font-medium text-lg">{test.name}</span>
          </div>
          {results && results.length > 0 && (
            <TestOutputsGroup outputs={results} />
          )}
        </Button>
      </Heading>
      <DisclosurePanel>
        <div className="flex flex-col gap-3 px-3 pb-3">
          {results
            ?.sort((a, b) => {
              if (a.status === b.status) return 0;
              if (a.status === "error") return -1;
              return 1;
            })
            .map((output, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 border-2 border-amber-950 bg-amber-50 py-2 pl-2"
              >
                <div className="flex items-center gap-1">
                  <TestOutputIcon output={output} size={20} />
                  <span className="leading-tight">
                    {output.message instanceof z.ZodError
                      ? z.prettifyError(output.message).replace("✖ ", "")
                      : output.message}
                  </span>
                </div>
                {xml && output.path && (
                  <XmlPathPreview
                    xml={xml}
                    path={output.path}
                    attribute={output.attribute}
                    text={output.text}
                  />
                )}
                {xml &&
                  output.paths &&
                  output.paths.map((path, idx) => (
                    <XmlPathPreview
                      key={idx}
                      xml={xml}
                      path={path}
                      attribute={output.attribute}
                      text={output.text}
                    />
                  ))}
              </div>
            ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
