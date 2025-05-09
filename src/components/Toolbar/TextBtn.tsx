import React from "react";
import IconBtn from "./IconBtn";
import { AiOutlineFontSize } from "react-icons/ai";

const TextBtn = ({
  onClick,
  isActive,
}: {
  onClick: () => void;
  isActive: boolean;
}) => {
  return (
    <IconBtn isActive={isActive} onClick={onClick}>
      <AiOutlineFontSize className="h-5 w-5" />
    </IconBtn>
  );
};

export default TextBtn;
