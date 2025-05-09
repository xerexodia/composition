"use client";
import { useDesignStore } from "@/lib/useDesignStore";
import React, { useRef } from "react";
import { useCanvas } from "./useCanvas";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import Toolbar from "../Toolbar/Toolbar";

export const Canvas = () => {
  const { currentDocument, camera } = useDesignStore();
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    canvasRef,
    containerRef,
  } = useCanvas();

  // useResizeObserver(containerRef, (entries) => {
  //   const entry = entries[0];
  //   if (entry && canvasRef.current) {
  //     canvasRef.current.width = entry.contentRect.width;
  //     canvasRef.current.height = entry.contentRect.height;
  //   }
  // });

  return (
    <div
      ref={containerRef}
      className="flex relative w-full h-screen overflow-hidden items-center justify-center"
    >
      <canvas
        style={{ touchAction: "none" }}
        ref={canvasRef}
        className="absolute left-0 top-0 w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />

      <Toolbar />
    </div>
  );
};
