import { NextResponse } from "next/server";
import { getSampleQuestions } from "@/lib/sampleQuestions";

export function GET() {
  const questions = getSampleQuestions();
  return NextResponse.json(questions);
}
