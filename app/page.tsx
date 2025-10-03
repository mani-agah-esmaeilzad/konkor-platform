import { AssistantHeader } from "@/components/assistant/AssistantHeader";
import { QuestionGenerator } from "@/components/assistant/QuestionGenerator";
import { SampleQuestions } from "@/components/assistant/SampleQuestions";
import { QuestionSolver } from "@/components/assistant/QuestionSolver";

export default function HomePage() {
  return (
    <main className="container">
      <AssistantHeader />
      <QuestionGenerator />
      <SampleQuestions />
      <QuestionSolver />
    </main>
  );
}
