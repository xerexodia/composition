import { useDesignStore } from "@/lib/useDesignStore";
import React, { memo } from "react";
import { LayerType } from "../../../types";
import Rectangle from "../Elements/Rectangle";
import Ellipse from "../Elements/Ellipse";
import Path from "../Elements/Path";

const LayerComponent = memo(({ id }: { id: string }) => {
  const { getLayerById } = useDesignStore();
  const layer = getLayerById(id);
  if (!layer) {
    return null;
  }

  switch (layer.type) {
    case LayerType.Rectangle:
      return (
       <Rectangle layer={layer}/>
      );
    case LayerType.Path:
      return (
       <Path {...layer}/>
      );
    case LayerType.Ellipse:
      return (
       <Ellipse layer={layer}/>
      );

    default:
      return null;
  }
});

LayerComponent.displayName = "LayerComponent";
export default LayerComponent;
