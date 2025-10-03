import knowledgeBase from "@/data/konkur_1402_tajrobi.sample.json";
import type { ReferenceSource, SampleQuestion } from "./types";

interface IndexedSample {
  source: SampleQuestion;
  normalized: string;
}

const indexedSamples: IndexedSample[] = (knowledgeBase as SampleQuestion[]).map(
  (item) => ({
    source: item,
    normalized: normalizeText(
      [
        item.subject,
        item.topic,
        item.question,
        item.options?.join(" ") ?? "",
        item.explanation ?? "",
      ].join(" \n ")
    ),
  })
);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0640\-_,.;:!?\u200c\u200f\u202a\u202b]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 1);
}

export function buildContextForQuery(
  query: string,
  limit = 3
): { context: string; references: ReferenceSource[] } {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return { context: "", references: [] };
  }

  const scored = indexedSamples
    .map(({ source, normalized }) => ({
      source,
      score: scoreSample(normalized, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) {
    return { context: "", references: [] };
  }

  const references = scored.map(({ source }) => ({
    subject: source.subject,
    topic: source.topic,
    source: source.source,
  }));

  const context = scored
    .map(({ source }) =>
      [
        `درس: ${source.subject}`,
        `مبحث: ${source.topic}`,
        `سوال: ${source.question}`,
        source.explanation ? `پاسخ تشریحی: ${source.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  return { context, references };
}

function scoreSample(normalizedContent: string, tokens: string[]) {
  let score = 0;
  for (const token of tokens) {
    if (normalizedContent.includes(token)) {
      score += token.length > 4 ? 2 : 1;
    }
  }
  return score;
}
