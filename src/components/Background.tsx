import { Dithering } from "@paper-design/shaders-react";
import { useMediaQuery } from "usehooks-ts";
import {
	LANDSCAPE_FAR,
	LANDSCAPE_MID,
	LANDSCAPE_MID_SHADOW,
	LANDSCAPE_NEAR,
} from "./landscape";

// Horizontal position of the sun in landscape coordinates; shadows are generated against it
const SUN_X = 1690;

// Horse and rider, one character per pixel
const RIDER_SPRITE = [
	"..........###...........",
	"........#.####.#........",
	"........########........",
	"..........###...........",
	"..........###...........",
	"..........###.....#.#...",
	"..........##......###...",
	".........#####...#####..",
	".........####.#..######.",
	".........####..#########",
	".........####..#####..##",
	".........#####.#####....",
	".........##########.....",
	"....################....",
	"..##################....",
	".##.################....",
	".#..###############.....",
	".#..##############......",
	"##..####...#.#####......",
	"....###.#..##.#..#......",
	"....##...#....#..#......",
	"....#....#....#...#.....",
	"....#....#...#....#.....",
	"....#....#...#....#.....",
	"....##...##..##...##....",
];

// Size of one sprite pixel in landscape units, matching the sky dither
const RIDER_PIXEL = 2;

const RIDER_RUNS = RIDER_SPRITE.flatMap((row, y) =>
	[...row.matchAll(/#+/g)].map((run) => ({
		x: run.index,
		y,
		width: run[0].length,
	})),
);

/** Pixel horse and rider standing with hooves centred on (x, y) */
function Rider({ x, y }: { x: number; y: number }) {
	const width = RIDER_SPRITE[0].length * RIDER_PIXEL;
	const height = RIDER_SPRITE.length * RIDER_PIXEL;
	return (
		<g
			transform={`translate(${x - width / 2} ${y - height}) scale(${RIDER_PIXEL})`}
			fill="#8f4a22"
			shapeRendering="crispEdges"
		>
			{RIDER_RUNS.map((run) => (
				<rect
					key={`${run.x}-${run.y}`}
					x={run.x}
					y={run.y}
					width={run.width}
					height={1}
				/>
			))}
		</g>
	);
}

/** Desert sky with a halftone haze, a setting sun and layered mesas */
export function Background() {
	const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)", {
		initializeWithValue: false,
	});

	return (
		<div
			aria-hidden
			className="bg-land-near fixed inset-0 h-lvh overflow-hidden"
		>
			<div className="bg-sky absolute inset-x-0 top-0 h-[460px]">
				<Dithering
					width="100%"
					height={400}
					colorBack="#f5c78e"
					colorFront="#eca561a0"
					shape="simplex"
					type="8x8"
					size={2}
					rotation={97}
					speed={reduceMotion ? 0 : 0.25}
					scale={0.5}
				/>
			</div>

			<svg
				aria-hidden
				viewBox="0 0 3200 420"
				preserveAspectRatio="xMidYMin slice"
				className="absolute inset-x-0 top-[40px] h-[420px] w-full"
			>
				<defs>
					<radialGradient id="sun" cx="0.5" cy="0.4" r="0.6">
						<stop offset="0" stopColor="#f6a15c" />
						<stop offset="1" stopColor="var(--color-sun)" />
					</radialGradient>
					<clipPath id="landscape-mid">
						<path d={LANDSCAPE_MID} />
					</clipPath>
				</defs>
				<path d={LANDSCAPE_FAR} className="fill-land-far" />
				<circle cx={SUN_X} cy={212} r={44} fill="url(#sun)" />
				<path d={LANDSCAPE_MID} className="fill-land-mid" />
				<path
					d={LANDSCAPE_MID_SHADOW}
					clipPath="url(#landscape-mid)"
					fill="#c97a3e"
					fillOpacity={0.35}
				/>
				<Rider x={SUN_X + 10} y={222} />
				<path d={LANDSCAPE_NEAR} className="fill-land-near" />
			</svg>
		</div>
	);
}
