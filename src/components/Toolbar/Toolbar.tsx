import { useDesignStore } from "@/lib/useDesignStore";
import React from "react";
import SelectionBtn from "./SelectionBtn";
import ShapeBtn from "./ShapeBtn";
import { CanvasMode, LayerType } from "../../../types";
import PencilBtn from "./PencilBtn";
import TextBtn from "./TextBtn";
import ZoomInBtn from "./ZoomInBtn";
import ZoomOutBtn from "./ZoomOutBtn";

const Toolbar = () => {
  const { canvas, setTool, camera, preferences, zoomCamera } = useDesignStore();

  const canZoomIn = camera.zoom < 3;
  const canZoomOut = camera.zoom > 0.1;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center p-1 shadow-[0_0_10px] rounded-md px-2 ${
        preferences.darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="flex justify-center items-center gap-3">
        <SelectionBtn
          canvasMode={canvas.mode}
          isActive={
            canvas.mode === CanvasMode.None ||
            canvas.mode === CanvasMode.Dragging
          }
          onClick={() => setTool("select")}
        />

        <ShapeBtn
          canvasState={canvas}
          isActive={
            canvas.mode === CanvasMode.Inserting &&
            [LayerType.Rectangle, LayerType.Ellipse].includes(canvas.layerType)
          }
          onClick={(shapeType) => {
            setTool(shapeType);
          }}
        />

        <PencilBtn
          isActive={canvas.mode === CanvasMode.Pencil}
          onClick={() => {
            setTool("path");
          }}
        />

        <TextBtn
          isActive={canvas.mode === CanvasMode.Inserting}
          onClick={() => {
            setTool("text");
          }}
        />

        <div
          className={`w-[1px] self-stretch ${
            preferences.darkMode ? "bg-white/20" : "bg-black/10"
          }`}
        />

        <div className="flex items-center justify-center gap-3">
          <ZoomInBtn
            onClick={() => zoomCamera(camera.zoom + 0.1)}
            disabled={!canZoomIn}
          />
          <ZoomOutBtn
            onClick={() => zoomCamera(camera.zoom - 0.1)}
            disabled={!canZoomOut}
          />
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
