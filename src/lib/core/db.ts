import { openDB, DBSchema, IDBPDatabase } from "idb";
import { DesignDocument, HistoryEntry } from "../../../types";
import { createDefaultDocument } from "../utils/design";

interface DesignDBSchema extends DBSchema {
  documents: {
    key: string;
    value: DesignDocument;
    indexes: { "by-name": string; "by-date": Date };
  };
  history: {
    key: [string, number];
    value: HistoryEntry;
    indexes: { "by-document": string; "by-timestamp": Date };
  };
}

const DB_NAME = "design-db";
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
        historyStore.createIndex("by-timestamp", "timestamp");
      },
    });
  }
  return dbPromise;
}

export async function createDocument(
  name: string,
  width: number = 1920,
  height: number = 1080
): Promise<DesignDocument> {
  const db = await getDB();

  const newDoc: DesignDocument = createDefaultDocument(name, width, height);

  await db.add("documents", newDoc);
  return newDoc;
}

export async function saveDocument(document: DesignDocument): Promise<void> {
  const db = await getDB();
  const updatedDoc = {
    ...document,
    version: document.version + 1,
    updatedAt: new Date(),
  };
  await db.put("documents", updatedDoc);
}

export async function loadDocument(
  documentId: string
): Promise<DesignDocument | undefined> {
  const db = await getDB();
  return db.get("documents", documentId);
}

export async function listDocuments(): Promise<DesignDocument[]> {
  const db = await getDB();
  return db.getAll("documents");
}

export async function getDocumentByID(id: string): Promise<DesignDocument | undefined> {
  const db = await getDB();
  return db.get("documents", id);
}

export async function getHistoryByDocumentId(id: string): Promise<HistoryEntry[] | undefined> {
  const db = await getDB();
  return db.getAllFromIndex("history", "by-document", IDBKeyRange.only(id));
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put("history", entry);
}

export async function loadDocumentHistory(
  documentId: string
): Promise<HistoryEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex(
    "history",
    "by-document",
    IDBKeyRange.only(documentId)
  );
}



export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["documents", "history"], "readwrite");
  await tx.objectStore("documents").delete(id);
  await tx
    .objectStore("history")
    .delete(IDBKeyRange.bound([id, 0], [id, Infinity]));
  await tx.done;
}
