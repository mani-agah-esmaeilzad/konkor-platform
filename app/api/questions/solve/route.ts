import { NextResponse } from "next/server";
import { z } from "zod";
import { avalaiClient, assertAvalaiConfig } from "@/lib/avalai";
import { retrieveContext } from "@/lib/rag";
import { SOLVER_SYSTEM_PROMPT, SOLVER_USER_PROMPT } from "@/lib/prompts";
import type { SolveResponse } from "@/lib/types";

const bodySchema = z.object({
  question: z.string().min(10, "صورت سوال را کامل بنویسید"),
});

export async function POST(request: Request) {
  try {
    assertAvalaiConfig();
    const json = await request.json();
    const { question } = bodySchema.parse(json);

    const context = await retrieveContext(question, 4);

    const references = context.map((item) => item.metadata);
    const combinedContext = context.map((item) => item.text).join("\n---\n");

    const response = await avalaiClient.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: SOLVER_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: SOLVER_USER_PROMPT(question, combinedContext),
        },
      ],
      temperature: 0.3,
      max_output_tokens: 800,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "solve_question",
          schema: {
            type: "object",
            required: ["answer", "reasoning"],
            properties: {
              answer: { type: "string" },
              reasoning: { type: "string" },
            },
          },
        },
      },
    });

    const text = response.output_text;
    const result = text ? (JSON.parse(text) as SolveResponse) : null;

    if (!result) {
      throw new Error("پاسخ مدل نامعتبر بود");
    }

    return NextResponse.json({ ...result, references });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join(" - ")
        : error instanceof Error
        ? error.message
        : "خطای نامشخص";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
