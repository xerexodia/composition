import React from "react";
import { EllipseLayer } from "../../../types";
import { rgbaToHex } from "@/lib/utils/strings";

const Ellipse = ({ layer }: { layer: EllipseLayer }) => {
  const {
    fill,
    height,
    width,
    x,
    y,
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
        cx={width/2}
        cy={height/2}
        rx={width/2}
        ry={height/2}
      />
    </g>
  );
};

export default Ellipse;
