import React, { useEffect, useRef, useState } from "react";
import { CanvasMode, CanvasState, LayerType } from "../../../types";
import IconBtn from "./IconBtn";
import { IoEllipseOutline, IoSquareOutline } from "react-icons/io5";

const ShapeBtn = ({
  isActive,
  canvasState,
  onClick,
}: {
  isActive: boolean;
  canvasState: CanvasState;
  onClick: (layerType: LayerType.Ellipse | LayerType.Rectangle) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = (layerType: LayerType.Ellipse | LayerType.Rectangle) => {
    onClick(layerType);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);
  return (
    <div className="relative flex" ref={menuRef}>
      <IconBtn
        isActive={isActive}
        onClick={() => handleClick(LayerType.Rectangle)}
      >
        {canvasState.mode !== CanvasMode.Inserting && (
          <IoSquareOutline className="h-5 w-5" />
        )}
        {canvasState.mode === CanvasMode.Inserting &&
          (canvasState.layer === LayerType.Rectangle ||
            canvasState.layer === LayerType.Text) && (
            <IoSquareOutline className="h-5 w-5" />
          )}
        {canvasState.mode === CanvasMode.Inserting &&
          canvasState.layer === LayerType.Ellipse && (
            <IoEllipseOutline className="h-5 w-5" />
          )}
      </IconBtn>
      <button onClick={() => setIsOpen(!isOpen)} className="ml-[1px]">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute -top-20 min-w-[150px] rounded-xl bg-[#1e1e1e] p-2 shadow-lg">
          <button
            className={`flex w-full items-center rounded-md p-1 text-white hover:bg-blue-500 my-1 ${
              canvasState.mode === CanvasMode.Inserting &&
              canvasState.layer === LayerType.Rectangle
                ? "bg-blue-500"
                : ""
            }`}
            onClick={() => handleClick(LayerType.Rectangle)}
          >
            <span className="w-5 text-xs">
              {canvasState.mode === CanvasMode.Inserting &&
                canvasState.layer === LayerType.Rectangle &&
                "✓"}
            </span>
            <IoSquareOutline className="h-4 w-4 mr-2" />
            <span className="text-xs">Rectangle</span>
          </button>
          <button
            className={`flex w-full items-center rounded-md p-1 text-white hover:bg-blue-500 my-1 ${
              canvasState.mode === CanvasMode.Inserting &&
              canvasState.layer === LayerType.Ellipse
                ? "bg-blue-500"
                : ""
            }`}
            onClick={() => handleClick(LayerType.Ellipse)}
          >
            <span className="w-5 text-xs">
              {canvasState.mode === CanvasMode.Inserting &&
                canvasState.layer === LayerType.Ellipse &&
                "✓"}
            </span>
            <IoEllipseOutline className="h-4 w-4 mr-2" />
            <span className="text-xs">Ellipse</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ShapeBtn;
