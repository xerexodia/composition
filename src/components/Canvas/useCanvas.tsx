import { useCallback, useRef, useEffect } from "react";
import {
  CanvasMode,
  CanvasState,
  LayerType,
  Vector2D,
  ZoomableVector2D,
} from "../../../types";
import { useDesignStore } from "@/lib/useDesignStore";
import { pointerEventToCanvasPoint, renderLayer } from "@/lib/utils/design";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;

const renderInteractionPreview = (
  ctx: CanvasRenderingContext2D,
  params: {
    canvasState: CanvasState;
    camera: ZoomableVector2D;
  }
) => {
  const { canvasState, camera } = params;

  if (canvasState.mode === CanvasMode.Inserting) {
    const x = Math.min(
      canvasState.initialPosition.x,
      canvasState.currentPosition.x
    );
    const y = Math.min(
      canvasState.initialPosition.y,
      canvasState.currentPosition.y
    );
    const width = Math.abs(
      canvasState.currentPosition.x - canvasState.initialPosition.x
    );
    const height = Math.abs(
      canvasState.currentPosition.y - canvasState.initialPosition.y
    );
    
    ctx.setTransform(
      camera.zoom,
      0,
      0,
      camera.zoom,
      -camera.x * camera.zoom,
      -camera.y * camera.zoom
    );
    
    ctx.strokeStyle = "#458cff";
    ctx.fillStyle = "#2a7bff34"
    ctx.lineWidth = 1 / camera.zoom;
    
    if (canvasState.layerType === LayerType.Rectangle) {
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    } else if (canvasState.layerType === LayerType.Ellipse) {
      ctx.beginPath();
      ctx.ellipse(
        x + width / 2,
        y + height / 2,
        width / 2,
        height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }
};

export const useCanvas = () => {
  const {
    currentDocument,
    camera,
    preferences,
    canvas,
    zoomCamera,
    panCamera,
    completeInserting,
    startInserting,
    updateInserting,
  } = useDesignStore();
  const requestRef = useRef<number>(0);
  const lastPointRef = useRef<Vector2D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
   
    if (!canvasRef.current || !currentDocument) return;

    const canvasEl = canvasRef.current;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (!containerRef.current) return;
      
      const dpr = window.devicePixelRatio || 1;
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
    };

    const render = () => {
      if (!currentDocument || !ctx || !canvasRef.current || !containerRef.current) return;
      const docWidth = containerRef.current.clientWidth;
      const docHeight = containerRef.current.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = docWidth * dpr;
      canvasRef.current.height = docHeight * dpr;
      canvasRef.current.style.width = `${docWidth}px`;
      canvasRef.current.style.height = `${docHeight}px`;
      const zoomX = docWidth / currentDocument.width;
      const zoomY = docHeight / currentDocument.height;
      const zoom = Math.min(zoomX, zoomY);
  
      const offsetX = (docWidth - currentDocument.width * zoom) / 2;
      const offsetY = (docHeight - currentDocument.height * zoom) / 2;

      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.setTransform(
        zoom * dpr,
        0,
        0,
        zoom * dpr,
        offsetX * dpr,
        offsetY * dpr
      );

      ctx.clearRect(
        -offsetX * dpr / zoom,
        -offsetY * dpr / zoom,
        canvasRef.current.width / dpr / zoom,
        canvasRef.current.height / dpr / zoom
      );

      ctx.beginPath();
      ctx.rect(0, 0, currentDocument.width, currentDocument.height);
      ctx.clip();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, currentDocument.width, currentDocument.height);

      ctx.strokeStyle = "#757575";
      ctx.lineWidth = 1 / camera.zoom;
      ctx.strokeRect(0, 0, currentDocument.width, currentDocument.height);

      currentDocument.rootLayerIds.forEach((layerId) => {
        const layer = currentDocument.layers[layerId];
        if (!layer.visible) return;
        renderLayer(ctx, layer, camera);
      });

      renderInteractionPreview(ctx, { canvasState: canvas, camera });

      requestRef.current = requestAnimationFrame(render);
    };

    resizeCanvas();
    requestRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [currentDocument, camera, preferences, canvas]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!canvasRef.current) return;

      const point = pointerEventToCanvasPoint(e, canvasRef.current, camera);
      lastPointRef.current = point;

      if (e.button === 0) { 
        if (e.ctrlKey || e.metaKey) {
          isDraggingRef.current = true;
        } else {
          startInserting(LayerType.Rectangle, point);
        }
      }
    },
    [camera, startInserting]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!canvasRef.current || !lastPointRef.current) return;

      const point = pointerEventToCanvasPoint(e, canvasRef.current, camera);
      const delta = {
        x: point.x - lastPointRef.current.x,
        y: point.y - lastPointRef.current.y,
      };
      lastPointRef.current = point;

      if (isDraggingRef.current && canvas.mode === CanvasMode.Panning) {
        panCamera(delta);
      } else if (canvas.mode === CanvasMode.Inserting) {
        updateInserting(point);
      }
    },
    [camera, canvas.mode, panCamera, updateInserting]
  );

  const handlePointerUp = useCallback(() => {
    if (canvas.mode === CanvasMode.Inserting) {
      completeInserting();
    }
    isDraggingRef.current = false;
  }, [canvas.mode, completeInserting]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!canvasRef.current) return;
      const point = pointerEventToCanvasPoint(e, canvasRef.current, camera);
      
      if (e.ctrlKey) {
        const zoomDelta = e.deltaY * ZOOM_SENSITIVITY;
        const newZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, camera.zoom * Math.exp(-zoomDelta))
        );
        zoomCamera(newZoom, point);
      } else {
        panCamera({
          x: -e.deltaX,
          y: -e.deltaY,
        });
      }
    },
    [camera, zoomCamera, panCamera]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
      } else if (e.key === "Escape") {
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    canvasRef,
    containerRef,
  };
};