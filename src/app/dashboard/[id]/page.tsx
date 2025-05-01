import Canvas from "@/components/Canvas/Canvas";
import Room from "@/components/Room/Room";
import React from "react";

type ParamsType = Promise<{ id: string }>;

const page = async ({ params }: { params: ParamsType }) => {
  const { id } = await params;

  return (
    <Room roomId={id}>
      <Canvas />
    </Room>
  );
};

export default page;
