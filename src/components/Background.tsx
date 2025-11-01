export function Background() {
  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      className="fixed h-svh w-screen"
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

      {/* Cloud 1 */}
      <g opacity="0.9">
        <ellipse cx="920" cy="95" rx="40" ry="15" fill="white" />
        <circle cx="910" cy="80" r="20" fill="white" />
        <circle cx="935" cy="75" r="25" fill="white" />
      </g>

      {/* Cloud 2 */}
      <g opacity="0.9">
        <ellipse cx="150" cy="162" rx="35" ry="12" fill="white" />
        <circle cx="142" cy="150" r="17" fill="white" />
        <circle cx="163" cy="147" r="20" fill="white" />
      </g>

      {/* Cloud 3 */}
      <g opacity="0.9">
        <ellipse cx="550" cy="211" rx="30" ry="11" fill="white" />
        <circle cx="543" cy="201" r="15" fill="white" />
        <circle cx="562" cy="199" r="17" fill="white" />
      </g>
    </svg>
  );
}
