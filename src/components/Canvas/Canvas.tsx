"use client";
import { rgbaToHex } from "@/lib/utils/strings";
import React, { useMemo } from "react";
import LayerComponent from "../LayerComponent/LayerComponent";
import useCanvas from "./useCanvas";
import Toolbar from "../Toolbar/Toolbar";

const Canvas = () => {
  const {
    currentDocument,
    onPointerUp,
    canvasState,
    setCanvasState,
    camera,
    setCamera,
    onWheel,
    onPointerDown,
    onPointerMove
  } = useCanvas();

  const backgroundColor = useMemo(() => 
    currentDocument ? rgbaToHex(currentDocument.bgColor) : "#fff",
    [currentDocument?.bgColor]
  );

  const transformStyle = useMemo(() => ({
    transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`
  }), [camera.x, camera.y, camera.zoom]);

  const layers = useMemo(() => 
    currentDocument?.rootLayerIds?.map(id => (
      <LayerComponent key={id} id={id} />
    )), 
    [currentDocument?.rootLayerIds]
  );

  return (
    <div className="flex h-screen w-full">
      <main className="overflow-y-auto fixed left-0 right-0 h-screen">
        <div
          style={{ backgroundColor }}
          className="h-full w-full touch-none"
        >
          <svg
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="w-full h-full"
          >
            <g style={transformStyle}>
              {layers}
            </g>
          </svg>
        </div>
      </main>
      
      <Toolbar
        canvaState={canvasState}
        setCanvasState={setCanvasState}
        canZoomIn={camera.zoom < 2}
        canZoomOut={camera.zoom > 0.5}
        zoomIn={() => setCamera(cam => ({ ...cam, zoom: cam.zoom + 0.1 }))}
        zoomOut={() => setCamera(cam => ({ ...cam, zoom: cam.zoom - 0.1 }))}
      />
    </div>
  );
};

export default React.memo(Canvas);