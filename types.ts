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

type BaseLayerProperties = {
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
}

export type RectangleLayer = BaseLayerProperties & {
  type: LayerType.Rectangle;
  cornerRadius?: number;
  fill: RGBAColor;
  stroke?:Stroke
};

export type EllipseLayer = BaseLayerProperties & {
  type: LayerType.Ellipse;
  cornerRadius?: number;
  fill: RGBAColor;
  stroke?:Stroke
};

export type PathLayer = BaseLayerProperties & {
  type: LayerType.Path;
  fill: RGBAColor;
  stroke?: Stroke
  points: number[][];
};

export type TextLayer = BaseLayerProperties & {
  type: LayerType.Text;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  fill: RGBAColor;
};

export type GroupLayer = BaseLayerProperties & {
  type: LayerType.Group;
  children: string[];
};

export type Layer = RectangleLayer | TextLayer | GroupLayer | EllipseLayer;

export type Document = {
  id: string;
  name: string;
  layers: Record<string, Layer>;
  rootLayerIds: string[];
  bgColor: RGBAColor;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AppTool = "select" | "rectangle" | "text" | "move" | "none";
export type ZoomableVector2D = Vector2D & { zoom: number };

export type AppState = {
  currentDocument: Document | null;
  selectedLayerIds: string[];
  camera: ZoomableVector2D;
  tool: AppTool;
};

export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.Inserting;
      layer: LayerType;
    }
  | {
      mode: CanvasMode.Dragging;
      origin: Vector2D | null;
    }
  | {
      mode: CanvasMode.Pencil;
    };

export enum CanvasMode {
  None,
  Inserting,
  Dragging,
  Pencil,
}
