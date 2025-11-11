import clsx from "clsx";
import { Children, isValidElement } from "react";
import { twMerge } from "tailwind-merge";

export function AvatarGroup({
  children,
  max = 3,
  moreLabel = (count) => `+${count} others`,
  className,
  labelClassName,
}: {
  children: React.ReactNode;
  max?: number;
  moreLabel?: (extraCount: number) => string;
  className?: string;
  labelClassName?: string;
}) {
  const valid_children = Children.toArray(children).filter(isValidElement);
  const visible_children = valid_children.slice(0, max);
  const num_extra = valid_children.length - visible_children.length;

  return (
    <div className={twMerge("flex items-center", className)}>
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
        <span className={twMerge("ml-2 select-none", labelClassName)}>
          {moreLabel(num_extra)}
        </span>
      )}
    </div>
  );
}
