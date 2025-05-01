import React, { useEffect, useRef, useState } from "react";
import { CanvasMode } from "../../../types";
import IconBtn from "./IconBtn";
import { BiPointer } from "react-icons/bi";
import { RiHand } from "react-icons/ri";

const SelectionBtn = ({
  isActive,
  canvasMode,
  onClick,
}: {
  isActive: boolean;
  canvasMode: CanvasMode;
  onClick: (canvasMode: CanvasMode.None | CanvasMode.Dragging) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = (canvasMode: CanvasMode.None | CanvasMode.Dragging) => {
    onClick(canvasMode);
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
        onClick={() => onClick(CanvasMode.None)}
      >
        {canvasMode !== CanvasMode.None &&
          canvasMode !== CanvasMode.Dragging && (
            <BiPointer className="h-5 w-5" />
          )}
        {canvasMode === CanvasMode.None && <BiPointer className="h-5 w-5" />}
        {canvasMode === CanvasMode.Dragging && <RiHand className="h-5 w-5" />}
      </IconBtn>
      <button onClick={() => setIsOpen(!isOpen)} className="ml-1">
        <svg
          width="20"
          height="20"
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
              canvasMode === CanvasMode.None ? "bg-blue-500" : ""
            }`}
            onClick={() => handleClick(CanvasMode.None)}
          >
            <span className="w-5 text-xs">
              {canvasMode === CanvasMode.None && "✓"}
            </span>
            <BiPointer className="h-4 w-4 mr-2" />
            <span className="text-xs">Move</span>
          </button>
          <button
            className={`flex w-full items-center rounded-md p-1 text-white hover:bg-blue-500 my-1 ${
              canvasMode === CanvasMode.Dragging ? "bg-blue-500" : ""
            }`}
            onClick={() => handleClick(CanvasMode.Dragging)}
          >
            <span className="w-5 text-xs">
              {canvasMode === CanvasMode.Dragging && "✓"}
            </span>
            <RiHand className="h-4 w-4 mr-2" />
            <span className="text-xs">Hand tool</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectionBtn;
