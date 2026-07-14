const SVG_TAGS = new Set<string>([
  "svg",
  "path",
  "circle",
  "rect",
  "g",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "clipPath",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "image",
  "symbol",
  "marker",
  "pattern",
]);

const SVG_PROP_KEYS = new Set<string>(["id", "textContent", "tabIndex"]);

type SVGAttributes = {
  id?: string;
  class?: string;
  transform?: string;

  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;

  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  rx?: number | string;
  ry?: number | string;

  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;

  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;

  viewBox?: string;
  d?: string;
  points?: string;
};

export { SVG_TAGS, type SVGAttributes, SVG_PROP_KEYS };
