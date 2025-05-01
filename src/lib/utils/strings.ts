import { RGBAColor } from "../../../types"

export const rgbaToHex = (color: RGBAColor): string => {
    const toHex = (value: number): string => {
      const hex = Math.round(value).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
  
    const { r, g, b, a } = color;
  
    const hexR = toHex(r);
    const hexG = toHex(g);
    const hexB = toHex(b);
    const hexA = a !== undefined ? toHex(a * 255) : '';
  
    return `#${hexR}${hexG}${hexB}${hexA}`;
  };