import React from 'react'
import IconBtn from './IconBtn'
import {  AiOutlineZoomOut } from 'react-icons/ai'

const ZoomOutBtn = ({onClick,disabled}:{onClick:()=>void,disabled:boolean}) => {
  return (
    <IconBtn
        onClick={onClick}
        disabled={disabled}
    >
        <AiOutlineZoomOut size={22} color={"#888888"}/>
    </IconBtn>
  )
}

export default ZoomOutBtn