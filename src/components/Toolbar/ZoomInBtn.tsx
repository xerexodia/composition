import React from "react";
import IconBtn from "./IconBtn";
import { AiOutlineZoomIn } from "react-icons/ai";

const ZoomInBtn = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <IconBtn onClick={onClick} disabled={disabled}>
      <AiOutlineZoomIn size={22} color={"#888888"} />
    </IconBtn>
  );
};

export default ZoomInBtn;
