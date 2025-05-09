import React from "react";
import {
  BaseLayerProperties,
  CanvasMode,
  CanvasState,
  DesignDocument,
  Layer,
  LayerType,
  PathLayer,
  RGBAColor,
  Vector2D,
  ZoomableVector2D,
} from "../../../types";

export const pointerEventToCanvasPoint = (
  e: React.PointerEvent | React.WheelEvent,
  canvas: HTMLCanvasElement,
  camera: ZoomableVector2D
) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - camera.x) / camera.zoom,
    y: (e.clientY - rect.top - camera.y) / camera.zoom,
  };
};

export const renderCanvas = (
  ctx: CanvasRenderingContext2D,
  params: {
    document: DesignDocument;
    camera: ZoomableVector2D;
    canvasState: CanvasState;
    preferences: {
      darkMode: boolean;
      showRulers: boolean;
    };
  }
) => {
  const { document, camera, preferences } = params;
  const { width, height } = document;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();

  ctx.fillStyle = preferences.darkMode ? '#1a1a1a' : '#f0f0f0';
  ctx.fillRect(0, 0, ctx.canvas.width / camera.zoom, ctx.canvas.height / camera.zoom);

  ctx.save();
  
  ctx.strokeStyle = preferences.darkMode ? '#444' : '#ddd';
  ctx.lineWidth = 1 / camera.zoom;
  ctx.strokeRect(0, 0, width, height);
  
  // document.rootLayerIds.forEach((layerId) => {
  //   const layer = document.layers[layerId];
  //   if (!layer.visible) return;
    
  //   renderLayer(ctx, layer);
  // });
  
  ctx.restore();

  // Draw rulers if enabled
  // if (preferences.showRulers) {
  //   renderRulers(ctx, camera, width, height, docX, docY);
  // }
};


export const renderLayer = (
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  camera: { x: number; y: number; zoom: number }
) => {
  ctx.save();

  // Apply global zoom and pan
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, -camera.x * camera.zoom, -camera.y * camera.zoom);

  // Then position the layer locally
  ctx.translate(layer.x, layer.y);

  switch (layer.type) {
    case "rectangle":
      ctx.fillStyle = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;
      ctx.fillRect(0, 0, layer.width, layer.height);
      break;

    case "ellipse":
      ctx.fillStyle = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;
      ctx.beginPath();
      ctx.ellipse(
        layer.width / 2,
        layer.height / 2,
        layer.width / 2,
        layer.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;

    case "text":
      ctx.fillStyle = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;
      ctx.font = `${layer.fontSize}px sans-serif`;
      ctx.fillText(layer.value, 0, layer.fontSize ?? 16);
      break;

    // case "path":
    //   renderPathLayer(ctx, layer);
    //   break;
  }

  ctx.restore();
};


const renderInteractionPreview = (
  ctx: CanvasRenderingContext2D,
  params: {
    canvasState: CanvasState;
    document: DesignDocument;
    camera: ZoomableVector2D;
  }
) => {
  const { canvasState } = params;

  switch (canvasState.mode) {
    case CanvasMode.Inserting:
      if (canvasState.initialPosition) {
        const currentPos = canvasState.initialPosition;
        const x = Math.min(canvasState.initialPosition.x, currentPos.x);
        const y = Math.min(canvasState.initialPosition.y, currentPos.y);
        const width = Math.abs(currentPos.x - canvasState.initialPosition.x);
        const height = Math.abs(currentPos.y - canvasState.initialPosition.y);

        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2 / params.camera.zoom;
        ctx.setLineDash([5 / params.camera.zoom, 5 / params.camera.zoom]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
      }
      break;
    // case CanvasMode.Selecting:
    //   if (canvasState.origin && canvasState.current) {
    //     const x = Math.min(canvasState.origin.x, canvasState.current.x);
    //     const y = Math.min(canvasState.origin.y, canvasState.current.y);
    //     const width = Math.abs(canvasState.current.x - canvasState.origin.x);
    //     const height = Math.abs(canvasState.current.y - canvasState.origin.y);

    //     ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    //     ctx.strokeStyle = '#3b82f6';
    //     ctx.lineWidth = 1 / params.camera.zoom;
    //     ctx.fillRect(x, y, width, height);
    //     ctx.strokeRect(x, y, width, height);
    //   }
    //   break;
  }
};

// Helper functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// const renderRulers = (
//   ctx: CanvasRenderingContext2D,
//   camera: ZoomableVector2D,
//   width: number,
//   height: number
// ) => {
//   // Ruler implementation would go here
// };

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

export const generateDefaultLayer = (
  type: LayerType,
  bounds: {
    x:number;
    y:number;
    height:number;
    width:number;
  }
): Layer => {
  const baseLayer: BaseLayerProperties = {
    id: crypto.randomUUID(),
    type,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    visible: true,
    locked: false,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
  };

  switch (type) {
    case LayerType.Rectangle:
      return {
        ...baseLayer,
        type: LayerType.Rectangle,
        fill: { r: 229, g: 229, b: 229, a: 1 },
        cornerRadius: 0,
      };
    case LayerType.Ellipse:
      return {
        ...baseLayer,
        type: LayerType.Ellipse,
        fill: { r: 229, g: 229, b: 229, a: 1 },
      };
    case LayerType.Path:
      return {
        ...baseLayer,
        type: LayerType.Path,
        fill: { r: 229, g: 229, b: 229, a: 1 },
        points: [
          [0, 0],
          [50, 50],
          [100, 0],
        ],
      };
    case LayerType.Text:
      return {
        ...baseLayer,
        type: LayerType.Text,
        value: "Text Layer",
        fontSize: 16,
        fontFamily: "Arial",
        fontWeight: 400,
        fill: { r: 0, g: 0, b: 0, a: 1 },
      };
    case LayerType.Group:
      return {
        ...baseLayer,
        type: LayerType.Group,
        children: [],
      };
    default:
      throw new Error(`Unknown layer type: ${type}`);
  }
};

export const createDefaultDocument = (
  name: string,
  width: number = 1920,
  height: number = 1080
): DesignDocument => {
  return {
    id: crypto.randomUUID(),
    name,
    width: width,
    height: height,
    layers: {},
    rootLayerIds: [],
    bgColor: { r: 255, g: 255, b: 255, a: 1 },
    settings: {
      units: "px",
      gridVisible: true,
      gridSize: 20,
      gridColor: { r: 200, g: 200, b: 200, a: 0.2 },
      snapToGrid: true,
      exportSettings: {
        defaultFormat: "png",
        defaultScale: 1,
        defaultBackground: "transparent",
      },
    },
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
