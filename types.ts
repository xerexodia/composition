export type Vector2D = {
  x: number;
  y: number;
};

export type RGBAColor = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

export enum LayerType {
  Rectangle = "rectangle",
  Ellipse = "ellipse",
  Path = "path",
  Text = "text",
  Group = "group",
}

export type BaseLayerProperties = {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  visible: boolean;
  locked: boolean;
  name: string;
};

export type Stroke = {
  color: RGBAColor;
  width: number;
  dashArray?: number[];
};

export type ShadowEffect = {
  color: RGBAColor;
  offset: Vector2D;
  blur: number;
  spread?: number;
};

export type BlurEffect = {
  radius: number;
  type: "background" | "layer";
};

export type LayerEffect = ShadowEffect | BlurEffect;

export type RectangleLayer = BaseLayerProperties & {
  type: LayerType.Rectangle;
  cornerRadius?:
    | number
    | {
        topLeft: number;
        topRight: number;
        bottomLeft: number;
        bottomRight: number;
      };
  fill: RGBAColor;
  stroke?: Stroke;
  effects?: LayerEffect[];
};

export type EllipseLayer = BaseLayerProperties & {
  type: LayerType.Ellipse;
  fill: RGBAColor;
  stroke?: Stroke;
  effects?: LayerEffect[];
};

export type PathLayer = BaseLayerProperties & {
  type: LayerType.Path;
  fill: RGBAColor;
  stroke?: Stroke;
  points: number[][];
  effects?: LayerEffect[];
};

export type TextLayer = BaseLayerProperties & {
  type: LayerType.Text;
  value: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  fontStyle?: "normal" | "italic" | "oblique";
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  letterSpacing?: number;
  fill: RGBAColor;
  stroke?: Stroke;
  effects?: LayerEffect[];
};

export type GroupLayer = BaseLayerProperties & {
  type: LayerType.Group;
  children: string[];
};

export type Layer =
  | RectangleLayer
  | TextLayer
  | EllipseLayer
  | PathLayer
  | GroupLayer;

export type DocumentSettings = {
  units: "px" | "in" | "cm" | "mm";
  gridVisible: boolean;
  gridSize: number;
  gridColor: RGBAColor;
  snapToGrid: boolean;
  exportSettings: {
    defaultFormat: "png" | "jpg" | "svg";
    defaultScale: number;
    defaultBackground: "transparent" | "color";
  };
};

export type DesignDocument = {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Record<string, Layer>;
  rootLayerIds: string[];
  bgColor: RGBAColor;
  settings: DocumentSettings;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface HistoryEntry {
  documentId: string;
  version: number;
  patches: Patch[];
  timestamp: Date;
  snapshot?: DesignDocument;
  author?: string;
}

export type ZoomableVector2D = Vector2D & { zoom: number };
export type AppTool =
  | "select"
  | "rectangle"
  | "ellipse"
  | "text"
  | "path"
  | "hand"
  | "zoom"
  | "none";
export type ResizingPosition =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";
export type AppState = {
  currentDocument: DesignDocument | null;
  selectedLayerIds: string[];
  camera: ZoomableVector2D;
  tool: AppTool;
  canvas: CanvasState;
  preferences: {
    darkMode: boolean;
    nudgeDistance: number;
    showRulers: boolean;
  };
};

export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.Panning;
    }
  | {
      mode: CanvasMode.Selecting;
    }
  | {
      mode: CanvasMode.Inserting;
      layerType: LayerType;
      initialPosition: Vector2D;
      currentPosition:Vector2D
    }
  | {
      mode: CanvasMode.Dragging;
      origin: Vector2D;
      originalLayers: Record<string, Layer>;
    }
  | {
      mode: CanvasMode.Pencil;
      currentPath: number[][];
    }
  | {
      mode: CanvasMode.Resizing;
      layerId: string;
      handlePosition: ResizingPosition;
      initialBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };

export enum CanvasMode {
  None,
  Inserting,
  Dragging,
  Pencil,
  Resizing,
  Rotating,
  Panning,
  Selecting
}

type PatchOperation = "add" | "remove" | "replace" | "move" | "copy";

type BasePatch<T extends PatchOperation, V = unknown> = {
  op: T;
  path: string[];
  value?: V;
  oldValue?: V;
  index?: number;
  fromPath?: string[];
};

export type AddPatch = BasePatch<"add">;
export type RemovePatch = BasePatch<"remove">;
export type ReplacePatch = BasePatch<"replace">;
export type MovePatch = BasePatch<"move", number>;
export type CopyPatch = BasePatch<"copy">;

export type Patch =
  | AddPatch
  | RemovePatch
  | ReplacePatch
  | MovePatch
  | CopyPatch;
