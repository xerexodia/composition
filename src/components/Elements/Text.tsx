import React, { useEffect, useRef, useState } from "react";
import { TextLayer } from "../../../types";
import { rgbaToHex } from "@/lib/utils/strings";
import { useDesignStore } from "@/lib/useDesignStore";

const Text = ({ id, layer }: { layer: TextLayer; id: string }) => {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(layer?.value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateLayerById } = useDesignStore();

  const update = () => {
    updateLayerById(id, { value: inputVal });
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditing(false);
      update();
    }
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <g onDoubleClick={() => setEditing(true)}>
      {editing ? (
        <foreignObject
          x={layer?.x}
          y={layer?.y}
          height={layer.height}
          width={layer?.width}
        >
          <input
            ref={inputRef}
            style={{
              fontSize: `${layer?.fontSize}px`,
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </foreignObject>
      ) : (
        <text
          x={layer?.x}
          y={layer?.y}
          fontSize={layer?.fontSize}
          fontWeight={layer?.fontFamily ?? 400}
          fill={rgbaToHex(layer?.fill)}
        >
          {layer?.value}
        </text>
      )}
    </g>
  );
};

export default Text;
