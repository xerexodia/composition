import React, { ReactNode } from "react";

const IconBtn = ({
  onClick,
  children,
  isActive,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
}) => {
  return (
    <button
      className={`flex items-center justify-center min-h-[28px] min-w-[28]px rounded-md text-gray-500 hover:text-gray-700 focus:text-gray-700 active:text-gray-900 disabled:cursor-default disabled:opacity-60 ${
        isActive
          ? "bg-gray-100 text-blue-600 hover:enabled:text-blue-600 focus:enabled:text-blue-600 active:enabled:text-blue-600"
          : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default IconBtn;
