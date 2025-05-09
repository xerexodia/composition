import React from "react";
import IconBtn from "./IconBtn";
import { PiPencil } from "react-icons/pi";

const PencilBtn = ({
  onClick,
  isActive,
}: {
  onClick: () => void;
  isActive: boolean;
}) => {
  return <IconBtn isActive={isActive} onClick={onClick}>
    <PiPencil size={20}/>
  </IconBtn>;
};

export default PencilBtn;
