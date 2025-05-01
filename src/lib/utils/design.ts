import React from "react";
import {
  LayerType,
  PathLayer,
  RGBAColor,
  Vector2D,
  ZoomableVector2D,
} from "../../../types";

export const pointerEventToCanvasPoint = (
  e: React.PointerEvent,
  camera: ZoomableVector2D
): Vector2D => {
  return {
    x: Math.round(e.clientX) - camera.x,
    y: Math.round(e.clientY) - camera.y,
  };
};

export const penPointsToPathLayer = (
  points: number[][],
  color: RGBAColor,
  zoom: number
): PathLayer => {
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const [x, y] = point;
    if (x === undefined || y === undefined) continue;

    if (left > x) {
      left = x;
    }
    if (top > y) {
      top = y;
    }
    if (right < x) {
      right = x;
    }
    if (bottom < y) {
      bottom = y;
    }
  }
  const id = crypto.randomUUID();
  return {
    fill: color,
    height: bottom - top,
    width: right - left,
    id,
    points: points
      .filter(
        (p): p is [number, number, number] =>
          p[0] !== undefined && p[1] !== undefined && p[2] !== undefined
      )
      .map(([x, y, pressure]) => [x - left, y - top, pressure]),
    locked: false,
    type: LayerType.Path,
    visible: true,
    x: left / zoom,
    y: top / zoom,
    name: id,
    stroke: {
      color,
      width: 1,
    },
  };
};

export const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const nextPoint = arr[(i + 1) % arr.length];
      if (!nextPoint) return acc;
      const [x1, y1] = nextPoint;
      acc.push(x0!, y0!, (x0! + x1!) / 2, (y0! + y1!) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};
