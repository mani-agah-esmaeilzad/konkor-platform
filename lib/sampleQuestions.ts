import sampleQuestionsData from "@/data/konkur_1402_tajrobi.sample.json";
import type { SampleQuestion } from "./types";

const SAMPLE_LIMIT = 12;

export function getSampleQuestions(): SampleQuestion[] {
  const dataset = sampleQuestionsData as SampleQuestion[];
  return dataset.slice(0, SAMPLE_LIMIT);
}
