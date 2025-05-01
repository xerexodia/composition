import React from "react";
import { RGBAColor, Stroke } from "../../../types";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "@/lib/utils/design";
import { rgbaToHex } from "@/lib/utils/strings";

const Path = ({
  x,
  y,
  stroke,
  fill,
  points,
}: {
  x: number;
  y: number;
  stroke?: Stroke;
  fill: RGBAColor;
  points: number[][];
}) => {
  const strokeData = getStroke(points, {
    size: 16,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  const path = getSvgPathFromStroke(strokeData);
  return (
    <path
      style={{ transform: `translate(${x}px, ${y}px)` }}
      d={path}
      fill={rgbaToHex(fill)}
      stroke={stroke?.color ? rgbaToHex(stroke?.color) : "#CCC"}
      strokeWidth={stroke?.width ?? 1}
    />
  );
};

export default Path;
