"use client";
import { rgbaToHex } from "@/lib/utils/strings";
import React, { useMemo } from "react";
import LayerComponent from "../LayerComponent/LayerComponent";
import useCanvas from "./useCanvas";
import Toolbar from "../Toolbar/Toolbar";
import Path from "../Elements/Path";

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
    onPointerMove,
    pencilDraft,
  } = useCanvas();

  const backgroundColor = useMemo(
    () => (currentDocument ? rgbaToHex(currentDocument.bgColor) : "#fff"),
    [currentDocument?.bgColor]
  );

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
    }),
    [camera.x, camera.y, camera.zoom]
  );

  const layers = useMemo(
    () =>
      currentDocument?.rootLayerIds?.map((id) => (
        <LayerComponent key={id} id={id} />
      )),
    [currentDocument?.rootLayerIds]
  );

  return (
    <div className="flex h-screen w-full">
      <main className="overflow-y-auto fixed left-0 right-0 h-screen">
        <div style={{ backgroundColor }} className="h-full w-full touch-none">
          <svg
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="w-full h-full"
          >
            <g style={transformStyle}>{layers}</g>
            {pencilDraft !== null && pencilDraft.length > 0 && (
              <Path
                x={0}
                y={0}
                fill={{
                  b: 233,
                  g: 233,
                  r: 233,
                }}
                points={pencilDraft}
                stroke={{
                  color: {
                    b: 233,
                    g: 233,
                    r: 233,
                  },
                  width: 1,
                }}
              />
            )}
          </svg>
        </div>
      </main>

      <Toolbar
        canvaState={canvasState}
        setCanvasState={setCanvasState}
        canZoomIn={camera.zoom < 2}
        canZoomOut={camera.zoom > 0.5}
        zoomIn={() => setCamera((cam) => ({ ...cam, zoom: cam.zoom + 0.1 }))}
        zoomOut={() => setCamera((cam) => ({ ...cam, zoom: cam.zoom - 0.1 }))}
      />
    </div>
  );
};

export default React.memo(Canvas);
