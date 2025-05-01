"use client";
import { useDesignStore } from "@/lib/useDesignStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const { createDocument } = useDesignStore();
  const navigate = useRouter();
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <button
        onClick={async () => {
          const res = await createDocument("doc1");
          if (res) {
            navigate.push("/dashboard/" + res.id);
          }
        }}
      >
        creer
      </button>
    </div>
  );
}
