import { type ComponentProps, useState } from "react";
import { useInterval } from "usehooks-ts";

export function Background() {
  return (
    <div className="fixed h-svh w-screen overflow-hidden">
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="absolute inset-0"
        role="img"
        aria-label="Background image"
      >
        {/* Sky layer 1 (lightest) */}
        <path
          d="M 0 0 L 1000 0 L 1000 310 L 950 315 Q 920 320, 890 315 L 750 305 Q 720 310, 690 305 L 450 295 L 350 300 Q 320 305, 290 300 L 150 310 L 0 305 Z"
          fill="#f5c78e"
        />

        {/* Sky layer 2 (medium) */}
        <path
          d="M 0 295 L 80 300 L 200 290 Q 230 285, 260 290 L 400 295 L 550 285 L 650 290 Q 680 295, 710 290 L 850 285 L 920 292 L 1000 288 L 1000 560 L 920 565 L 800 555 Q 770 550, 740 555 L 580 565 L 420 555 L 320 560 Q 290 565, 260 560 L 100 555 L 0 560 Z"
          fill="#eca561"
        />

        {/* Sky layer 3 (darker) */}
        <path
          d="M 0 550 L 120 545 L 280 555 Q 310 560, 340 555 L 500 550 L 620 558 L 780 548 Q 810 543, 840 548 L 950 553 L 1000 548 L 1000 1000 L 0 1000 Z"
          fill="#e09552"
        />

        {/* Ground (darkest) */}
        <rect x="0" y="750" width="1000" height="250" fill="#d88745" />

        <Cloud x={200} y={20} opacity={0.5} />
      </svg>
    </div>
  );
}

type CloudProps = Omit<ComponentProps<"svg">, "viewBox" | "xmlns"> & {
  x?: number; // starting X (%)
  y?: number; // Y position (%)
  x_speed?: number; // % per second
  x_scale?: number;
  y_scale?: number;
  width?: number;
  height?: number;
};

export function Cloud({
  x = 0,
  y = 0,
  x_speed = 2,
  x_scale = 1,
  y_scale = 1,
  width = 400,
  height = 100,
  style,
  ...rest
}: CloudProps) {
  const [xPos, setXPos] = useState(x);

  // move smoothly using percentages
  useInterval(() => {
    setXPos((prev) => {
      const next = prev + x_speed / 60; // 60fps equivalent
      // reset to -50% after leaving 150%
      if (next > 150) return -50;
      if (next < -50) return 150;
      return next;
    });
  }, 1000 / 60);

  return (
    <svg
      viewBox="0 0 400 100"
      width={width}
      height={height}
      style={{
        position: "absolute",
        left: `${xPos}%`,
        top: `${y}%`,
        transform: `scale(${x_scale}, ${y_scale})`,
        transformOrigin: "center",
        willChange: "transform, left",
        pointerEvents: "none",
        ...style,
      }}
      {...rest}
      role="img"
      aria-label="Cloud"
    >
      {[
        [200, 55, 180, 30],
        [60, 50, 55, 32],
        [340, 52, 58, 34],
        [130, 48, 48, 28],
        [270, 46, 52, 30],
        [200, 44, 50, 26],
        [100, 35, 42, 24],
        [180, 30, 45, 26],
        [240, 32, 40, 24],
        [310, 36, 38, 22],
        [150, 38, 35, 20],
        [280, 40, 38, 22],
        [220, 35, 32, 18],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse
          key={JSON.stringify({ cx, cy, rx, ry })}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="white"
        />
      ))}
    </svg>
  );
}
