import { useProgressBar } from "react-aria";

export function ProgressCircle({
  isIndeterminate = false,
  value = 0,
  minValue = 0,
  maxValue = 100,
  size = 32,
}: {
  isIndeterminate?: boolean;
  value?: number;
  minValue?: number;
  maxValue?: number;
  size?: number;
}) {
  const { progressBarProps } = useProgressBar({
    isIndeterminate,
    value,
    minValue,
    maxValue,
  });

  const center = size / 2;
  const strokeWidth = 4;
  const r = size / 2 - strokeWidth;
  const c = 2 * r * Math.PI;
  const percentage = isIndeterminate
    ? 0.25
    : (value - minValue) / (maxValue - minValue);
  const offset = c - percentage * c;

  return (
    <svg
      {...progressBarProps}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      strokeWidth={strokeWidth}
      role="presentation"
      aria-label="Progress bar"
    >
      <circle cx={center} cy={center} r={r} stroke="gray" />
      <circle
        cx={center}
        cy={center}
        r={r}
        stroke="orange"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
        transform="rotate(-90 16 16)"
      >
        {isIndeterminate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            begin="0s"
            dur="1s"
            from={`0 ${center} ${center}`}
            to={`360 ${center} ${center}`}
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  );
}
