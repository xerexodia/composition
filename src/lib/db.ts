import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Document } from "../../types";
import { Patch } from "./utils/patch-utils";

interface DesignDBSchema extends DBSchema {
  documents: {
    key: string;
    value: Document;
    indexes: { "by-name": string; "by-date": Date };
  };
  history: {
    key: [string, number]; 
    value: {
      documentId: string;
      version: number;
      patches: Patch[];
      timestamp: Date;
    };
    indexes: { "by-document": string };
  };
}

const DB_NAME = "figma-clone-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DesignDBSchema>>;

export function getDB(): Promise<IDBPDatabase<DesignDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DesignDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const documentStore = db.createObjectStore("documents", {
          keyPath: "id",
        });
        documentStore.createIndex("by-name", "name");
        documentStore.createIndex("by-date", "updatedAt");

        const historyStore = db.createObjectStore("history", {
          keyPath: ["documentId", "version"],
        });
        historyStore.createIndex("by-document", "documentId");
      },
    });
  }
  return dbPromise;
}

type DocumentUpdateMessage = {
  type: "document-updated";
  documentId: string;
  version: number;
};

const broadcastChannel = new BroadcastChannel("figma-clone-updates");

export async function saveDocument(document: Document): Promise<void> {
  const db = await getDB();
  const updatedDoc: Document = {
    ...document,
    updatedAt: new Date(),
  };
  await db.put("documents", updatedDoc);
  broadcastChannel.postMessage({
    type: "document-updated",
    documentId: document.id,
    version: document.version,
  } as DocumentUpdateMessage);
}

export async function loadDocument(documentId: string): Promise<Document | undefined> {
  const db = await getDB();
  return db.get("documents", documentId);
}

export async function listDocuments(): Promise<Document[]> {
  const db = await getDB();
  return db.getAll("documents");
}

export async function createDocument(name: string): Promise<Document> {
  const db = await getDB();
  const newDoc: Document = {
    id: crypto.randomUUID(),
    name,
    layers: {},
    rootLayerIds: [],
    version: 0,
    bgColor:{b:255,g:255,r:255},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.add("documents", newDoc);
  return newDoc;
}

export function watchDocument(
  documentId: string,
  callback: (document: Document) => void
): () => void {
  const handler = async (event: MessageEvent<DocumentUpdateMessage>) => {
    if (event.data.type === "document-updated" && event.data.documentId === documentId) {
      const doc = await loadDocument(documentId);
      if (doc) callback(doc);
    }
  };

  broadcastChannel.addEventListener("message", handler);
  return () => broadcastChannel.removeEventListener("message", handler);
}

export async function saveHistory(
  documentId: string,
  version: number,
  patches: Patch[]
): Promise<void> {
  const db = await getDB();
  await db.put("history", {
    documentId,
    version,
    patches,
    timestamp: new Date(),
  });
}

export async function loadHistory(documentId: string): Promise<{
  version: number;
  patches: Patch[];
}[]> {
  const db = await getDB();
  return db.getAllFromIndex("history", "by-document", IDBKeyRange.only(documentId));
}