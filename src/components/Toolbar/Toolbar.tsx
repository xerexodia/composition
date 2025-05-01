import React from "react";
import { CanvasMode, CanvasState, LayerType } from "../../../types";
import SelectionBtn from "./SelectionBtn";
import ShapeBtn from "./ShapeBtn";
import ZoomInBtn from "./ZoomInBtn";
import ZoomOutBtn from "./ZoomOutBtn";

const Toolbar = ({
  canvaState,
  setCanvasState,
  zoomIn,
  zoomOut,
  canZoomIn,
  canZoomOut,
}: {
  canvaState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center bg-white p-1 shadow-[0_0_10px] rounded-md">
      <div className="flex justify-center items-center gap-3">
        <SelectionBtn
          isActive={
            canvaState.mode === CanvasMode.None ||
            canvaState.mode === CanvasMode.Dragging
          }
          canvasMode={canvaState.mode}
          onClick={(arg) =>
            setCanvasState(
              arg === CanvasMode.Dragging
                ? { mode: arg, origin: null }
                : { mode: arg }
            )
          }
        />
        <ShapeBtn
          isActive={
            canvaState.mode === CanvasMode.Inserting &&
            [LayerType.Rectangle, LayerType.Ellipse].includes(canvaState.layer)
          }
          canvasState={canvaState}
          onClick={(arg) =>
            setCanvasState({ mode: CanvasMode.Inserting, layer: arg })
          }
        />
      <div className="w-[1px] self-stretch bg-black/10" />
      <div className="flex items-center justify-center gap-3">
        <ZoomInBtn onClick={zoomIn} disabled={!canZoomIn} />
        <ZoomOutBtn onClick={zoomOut} disabled={!canZoomOut} />
      </div>
      </div>
    </div>
  );
};

export default Toolbar;
