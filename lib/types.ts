export type DifficultyLevel = "آسان" | "متوسط" | "دشوار";

export interface SampleQuestion {
  subject: string;
  topic: string;
  source: string;
  difficulty: DifficultyLevel | string;
  question: string;
  options?: string[];
  correct_option_index?: number;
  explanation?: string;
}

export interface ReferenceSource {
  subject: string;
  topic: string;
  source: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GeneratedQuestion {
  question: string;
  answer: string;
  hints: string[];
}

export interface SolveResponse {
  answer: string;
  reasoning: string;
  references: ReferenceSource[];
}
