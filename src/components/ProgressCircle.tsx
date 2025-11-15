import { twMerge } from "tailwind-merge";

/** Progress circle */
export function ProgressCircle({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  const stroke = Math.max(2, size * 0.12);
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;

  return (
    <svg
      className={twMerge("block animate-spin", className)}
      width={size}
      height={size}
      role="img"
      aria-label="Progress circle"
    >
      <circle
        className={className}
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * 0.3}
        fill="none"
      />
    </svg>
  );
}
