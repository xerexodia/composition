import React from "react";
import {
  LayerType,
  PathLayer,
  RGBAColor,
  ZoomableVector2D,
} from "../../../types";

export const pointerEventToCanvasPoint = (
  e: React.PointerEvent,
  camera: ZoomableVector2D
) => {
  return {
    x: Math.round(e.clientX) - camera.x,
    y: Math.round(e.clientY) - camera.y,
  };
};

export const penPointsToPathLayer = (
  points: number[][],
  color: RGBAColor
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
    x: left,
    y: top,
    name: id,
    stroke: {
      color,
      width: 1,
    },
  };
};
