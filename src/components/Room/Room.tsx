"use client";
import { useDesignStore } from "@/lib/useDesignStore";
import React, { ReactNode, useEffect } from "react";

const Room = ({
  roomId,
  children,
}: {
  children: ReactNode;
  roomId: string;
}) => {
  const { loadDocument } = useDesignStore();
  useEffect(() => {
    (async () => {
      await loadDocument(roomId);
    })();
  });
  return <div>{children}</div>;
};

export default Room;
