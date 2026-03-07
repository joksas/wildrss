import clsx from "clsx";
import { Children, isValidElement } from "react";

// Constants
const MAX = 3;

export function AvatarGroup({ children }: { children: React.ReactNode }) {
  const moreLabel = (count: number) =>
    `+${count} ${count === 1 ? "other" : "others"}`;

  const valid_children = Children.toArray(children).filter(isValidElement);
  const visible_children = valid_children.slice(0, MAX);
  const num_extra = valid_children.length - visible_children.length;

  return (
    <div className="flex items-center">
      {visible_children.map((child, i) => (
        <div
          key={child.key}
          className={clsx({ "-ml-2": i > 0 })}
          style={{ zIndex: visible_children.length - i }}
        >
          {child}
        </div>
      ))}

      {num_extra > 0 && (
        <span className="select-none text-sm">{moreLabel(num_extra)}</span>
      )}
    </div>
  );
}
