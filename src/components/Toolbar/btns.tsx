import React from "react";
import { LayerType } from "../../../types";

interface BaseButtonProps {
  isActive?: boolean;
  onClick: () => void;
  darkMode?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const BaseButton: React.FC<BaseButtonProps> = ({
  isActive = false,
  onClick,
  darkMode = false,
  disabled = false,
  children
}) => (
  <button
    className={`p-2 rounded-md transition-colors ${
      isActive 
        ? darkMode 
          ? 'bg-blue-600 text-white' 
          : 'bg-blue-100 text-blue-800'
        : darkMode 
          ? 'hover:bg-gray-700 text-gray-200' 
          : 'hover:bg-gray-100 text-gray-700'
    } ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// Selection Button
export const SelectionBtn: React.FC<{
  isActive: boolean;
  onClick: () => void;
}> = ({ isActive, onClick }) => (
  <BaseButton isActive={isActive} onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 4H4V10H10V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 4H14V10H20V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 14H14V20H20V14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14H4V20H10V14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </BaseButton>
);

// Shape Button (with dropdown)
export const ShapeBtn: React.FC<{
  isActive: boolean;
  onClick: (shapeType: LayerType.Rectangle | LayerType.Ellipse) => void;
}> = ({ isActive, onClick }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <div className="relative">
      <BaseButton 
        isActive={isActive} 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </BaseButton>
      
      {showDropdown && (
        <div className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={() => {
              onClick(LayerType.Rectangle);
              setShowDropdown(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Rectangle
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            onClick={() => {
              onClick(LayerType.Ellipse);
              setShowDropdown(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Ellipse
          </button>
        </div>
      )}
    </div>
  );
};

// Pencil Button
export const PencilBtn: React.FC<{
  isActive: boolean;
  onClick: () => void;
}> = ({ isActive, onClick }) => (
  <BaseButton isActive={isActive} onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 19L19 12L22 15L15 22L12 19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 2L9.586 9.586"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </BaseButton>
);

// Text Button
export const TextBtn: React.FC<{
  isActive: boolean;
  onClick: () => void;
}> = ({ isActive, onClick }) => (
  <BaseButton isActive={isActive} onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 3V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 6H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </BaseButton>
);

// Zoom In Button
export const ZoomInBtn: React.FC<{
  onClick: () => void;
  disabled: boolean;
  darkMode?: boolean;
}> = ({ onClick, disabled, darkMode }) => (
  <BaseButton 
    onClick={onClick} 
    disabled={disabled}
    darkMode={darkMode}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21L16.65 16.65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 8V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 11H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </BaseButton>
);

// Zoom Out Button
export const ZoomOutBtn: React.FC<{
  onClick: () => void;
  disabled: boolean;
  darkMode?: boolean;
}> = ({ onClick, disabled, darkMode }) => (
  <BaseButton 
    onClick={onClick} 
    disabled={disabled}
    darkMode={darkMode}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle
        cx="11"
        cy="11"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21L16.65 16.65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 11H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </BaseButton>
);