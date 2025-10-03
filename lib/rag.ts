import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import knowledgeBase from "@/data/konkur_1402_tajrobi.sample.json";
import type { SampleQuestion } from "./types";

let storePromise: Promise<MemoryVectorStore> | null = null;

async function buildVectorStore() {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.AVALAI_API_KEY ?? process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL ?? "https://api.avalai.ir/v1",
    },
    model: "text-embedding-3-large",
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  });

  const documents = (knowledgeBase as SampleQuestion[]).map(
    (item) =>
      new Document({
        pageContent: [
          `درس: ${item.subject}`,
          `مبحث: ${item.topic}`,
          `سوال: ${item.question}`,
          item.options ? `گزینه ها: ${item.options.join(" | ")}` : "",
          item.explanation ? `پاسخ: ${item.explanation}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        metadata: {
          subject: item.subject,
          topic: item.topic,
          source: item.source,
        },
      }),
  );

  const splitted = await splitter.splitDocuments(documents);
  return MemoryVectorStore.fromDocuments(splitted, embeddings);
}

async function getStore() {
  if (!storePromise) {
    storePromise = buildVectorStore();
  }
  return storePromise;
}

export async function retrieveContext(query: string, k = 4) {
  const store = await getStore();
  const results = await store.similaritySearch(query, k);
  return results.map((doc) => ({
    text: doc.pageContent,
    metadata: doc.metadata as { subject: string; topic: string; source: string },
  }));
}
