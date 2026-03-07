import type { TestOutput } from "@/lib/tests/_index";
import { AvatarGroup } from "./AvatarGroup";
import { TestOutputIcon } from "./TestOutputIcon";

export function TestOutputsGroup({
  outputs,
}: {
  outputs: TestOutput[] | undefined;
}) {
  return (
    <>
      {outputs && (
        <AvatarGroup>
          {outputs.map((output, i) => (
            <TestOutputIcon key={i} output={output} size={20} />
          ))}
        </AvatarGroup>
      )}
    </>
  );
}
