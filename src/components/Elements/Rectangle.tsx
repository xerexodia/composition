import React from "react";
import { RectangleLayer } from "../../../types";
import { rgbaToHex } from "@/lib/utils/strings";

const Rectangle = ({ layer }: { layer: RectangleLayer }) => {
  const {
    fill,
    height,
    width,
    x,
    y,
    cornerRadius,
    stroke,
  } = layer;

  return (
    <g>
      <rect
        style={{
          transform: `translate(${x}px,${y}px)`,
        }}
        width={width}
        height={height}
        fill={fill ? rgbaToHex(fill) : "#ccc"}
        strokeWidth={stroke?.width ?? 1}
        stroke={stroke?.color ? rgbaToHex(stroke?.color) : "#ccc"}
        rx={cornerRadius}
        ry={cornerRadius}
      />
    </g>
  );
};

export default Rectangle;
