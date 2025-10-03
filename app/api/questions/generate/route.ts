import { NextResponse } from "next/server";
import { z } from "zod";
import { avalaiClient, assertAvalaiConfig } from "@/lib/avalai";
import { QUESTION_GENERATOR_SYSTEM, QUESTION_GENERATOR_USER } from "@/lib/prompts";
import type { GeneratedQuestion } from "@/lib/types";

const bodySchema = z.object({
  subject: z.string().min(2, "موضوع را دقیق‌تر وارد کنید"),
  difficulty: z.string().default("متوسط"),
});

export async function POST(request: Request) {
  try {
    assertAvalaiConfig();
    const json = await request.json();
    const { subject, difficulty } = bodySchema.parse(json);

    const completion = await avalaiClient.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: QUESTION_GENERATOR_SYSTEM,
        },
        {
          role: "user",
          content: QUESTION_GENERATOR_USER(subject, difficulty),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_question",
          schema: {
            type: "object",
            required: ["question", "answer", "hints"],
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              hints: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 3,
              },
            },
          },
        },
      },
    });

    const text = completion.output_text;
    const result = text ? (JSON.parse(text) as GeneratedQuestion) : null;

    if (!result) {
      throw new Error("پاسخ مدل خوانا نبود");
    }

    return NextResponse.json(result);
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
