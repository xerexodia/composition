import { useDesignStore } from "@/lib/useDesignStore";
import React, { useCallback, useState, useRef } from "react";
import {
  CanvasMode,
  CanvasState,
  LayerType,
  Vector2D,
  ZoomableVector2D,
} from "../../../types";
import { pointerEventToCanvasPoint } from "@/lib/utils/design";

const useCanvas = () => {
  const { currentDocument, addLayer } = useDesignStore();

  const [camera, setCamera] = useState<ZoomableVector2D>({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const canvasStateRef = useRef(canvasState);
  canvasStateRef.current = canvasState;

  const insertLayer = useCallback(
    (layerType: LayerType, position: Vector2D) => {
      const baseLayer = {
        x: position.x,
        y: position.y,
        fill: { b: 233, g: 233, r: 233 },
        visible: true,
        id: crypto.randomUUID(),
        locked: false,
        name: `Layer-${Date.now()}`,
      };

      if (layerType === LayerType.Rectangle) {
        addLayer({
          ...baseLayer,
          width: 200,
          height: 200,
          cornerRadius: 0,
          type: LayerType.Rectangle,
        });
      } else if (layerType === LayerType.Ellipse) {
        addLayer({
          ...baseLayer,
          width: 100,
          height: 100,
          cornerRadius: 0,
          type: LayerType.Ellipse,
        });
      }
    },
    [addLayer]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, cameraRef.current);

      requestAnimationFrame(() => {
        if (canvasStateRef.current.mode === CanvasMode.Inserting) {
          insertLayer(canvasStateRef.current.layer, point);
          return;
        }
        if (canvasStateRef.current.mode === CanvasMode.Dragging) {
          setCanvasState({ mode: CanvasMode.Dragging, origin: null });
          return;
        }
      });
    },
    [insertLayer]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    requestAnimationFrame(() => {
      setCamera((cam) => ({
        ...cam,
        x: cam.x - e.deltaX,
        y: cam.y - e.deltaY,
      }));
    });
  }, []);

  const startDrawing = useCallback((point: Vector2D, pressure: number) => {
    // Drawing implementation
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, cameraRef.current);

      if (canvasStateRef.current.mode === CanvasMode.Dragging) {
        setCanvasState({ mode: CanvasMode.Dragging, origin: point });
        return;
      }

      if (canvasStateRef.current.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
      }
    },
    [startDrawing]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (
      canvasStateRef.current.mode === CanvasMode.Dragging &&
      canvasStateRef.current.origin !== null
    ) {
      requestAnimationFrame(() => {
        setCamera((cam) => ({
          ...cam,
          x: cam.x + e.movementX,
          y: cam.y + e.movementY,
        }));
      });
    }
  }, []);

  return {
    currentDocument,
    insertLayer,
    onPointerUp,
    canvasState,
    setCanvasState,
    camera,
    setCamera,
    onWheel,
    onPointerDown,
    onPointerMove,
  };
};

export default useCanvas;
