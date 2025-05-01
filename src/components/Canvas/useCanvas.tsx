import { useDesignStore } from "@/lib/useDesignStore";
import React, { useCallback, useState, useRef } from "react";
import {
  CanvasMode,
  CanvasState,
  LayerType,
  Vector2D,
  ZoomableVector2D,
} from "../../../types";
import {
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
} from "@/lib/utils/design";

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

  const [pencilDraft, setPencilDraft] = useState<
    [x: number, y: number, pressure: number][] | null
  >(null);

  const insertLayer = useCallback(
    (layerType: LayerType, position: Vector2D) => {
      const baseLayer = {
        x: position.x / camera.zoom,
        y: position.y / camera.zoom,
        fill: { b: 233, g: 233, r: 233 },
        visible: true,
        id: crypto.randomUUID(),
        locked: false,
        name: `Layer-${Date.now()}`,
      };

      if (layerType === LayerType.Rectangle) {
        addLayer({
          ...baseLayer,
          width: 100,
          height: 100,
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
    [addLayer, camera.zoom]
  );

  const insertPath = useCallback(() => {
    if (pencilDraft === null || pencilDraft.length < 5) {
      setPencilDraft(null);
      return;
    }
    addLayer(penPointsToPathLayer(pencilDraft, { b: 233, g: 233, r: 233 },camera.zoom));
    setPencilDraft(null);
  }, [addLayer, pencilDraft,camera.zoom]);

  const startDrawing = useCallback(
    (point: Vector2D, pressure: number) => {
      setPencilDraft([[point.x, point.y, pressure]]);
    },
    [setPencilDraft]
  );

  const continueDrawing = useCallback(
    (point: Vector2D, e: React.PointerEvent) => {
      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft === null
      )
        return;
      setPencilDraft((arg) => [...arg!, [point.x, point.y, e.pressure]]);
    },
    [pencilDraft, canvasState.mode]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, cameraRef.current);

      requestAnimationFrame(() => {
        if (canvasStateRef.current.mode === CanvasMode.None) {
          setCanvasState({ mode: CanvasMode.None });
        } else if (canvasStateRef.current.mode === CanvasMode.Inserting) {
          insertLayer(canvasStateRef.current.layer, point);
        } else if (canvasStateRef.current.mode === CanvasMode.Dragging) {
          setCanvasState({ mode: CanvasMode.Dragging, origin: null });
        } else if (canvasStateRef.current.mode === CanvasMode.Pencil) {
          insertPath();
        }
      });
    },
    [insertLayer,insertPath]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    requestAnimationFrame(() => {
      setCamera((cam) => ({
        ...cam,
        x: cam.x - e.deltaX,
        y: cam.y - e.deltaY,
      }));
    });
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

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, cameraRef.current);

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
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(point, e);
      }
    },
    [continueDrawing, setCamera, canvasState, camera]
  );

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
    pencilDraft
  };
};

export default useCanvas;
