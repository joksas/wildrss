import { type ComponentProps, useState } from "react";
import { useInterval } from "usehooks-ts";

export function Background() {
  return (
    <div className="fixed h-svh w-screen overflow-hidden">
      <div className="absolute inset-0">
        {/* Sky — starts at 0px */}
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute h-svh w-full"
          style={{ top: "-200px" }}
          role="img"
          aria-label="Sky"
        >
          <path
            d="M0,15 C200,10 300,20 500,15 C700,10 800,20 1000,15 L1000,100 L0,100 Z"
            fill="#f5c78e"
          />
        </svg>

        {/* Layer 2 — starts at 200px */}
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute h-svh w-full"
          style={{ top: "150px" }}
          role="img"
          aria-label="Layer 2"
        >
          <path
            d="M0,8 C160,15 340,5 500,12 C660,19 840,9 1000,14 L1000,100 L0,100 Z"
            fill="#eca561"
          />
        </svg>

        {/* Layer 3 — starts at 50svh */}
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute h-svh w-full"
          style={{ top: "50svh" }}
          role="img"
          aria-label="Layer 3"
        >
          <path
            d="M0,10 C220,5 380,18 500,12 C620,6 820,16 1000,9 L1000,100 L0,100 Z"
            fill="#e09552"
          />
        </svg>

        {/* Layer 4 — starts at 70svh */}
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute h-svh w-full"
          style={{ top: "70svh" }}
          role="img"
          aria-label="Layer 4"
        >
          <path
            d="M0,12 C250,18 400,8 500,15 C600,22 780,10 1000,20 L1000,100 L0,100 Z"
            fill="#d88745"
          />
        </svg>

        {/* Layer 5 — starts at 90svh */}
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute h-svh w-full"
          style={{ top: "90svh" }}
          role="img"
          aria-label="Layer 5"
        >
          <path
            d="M0,15 C200,22 350,12 500,18 C650,24 820,14 1000,19 L1000,100 L0,100 Z"
            fill="#c87337"
          />
        </svg>
      </div>

      <Cloud
        x={50}
        y={20}
        x_scale={0.9}
        y_scale={0.7}
        opacity={0.5}
        x_speed={5}
      />
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
