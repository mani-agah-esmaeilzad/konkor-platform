import { NextResponse } from "next/server";
import { avalaiClient, assertAvalaiConfig } from "@/lib/avalai";
import { buildContextForQuery } from "@/lib/knowledge";
import type { ChatMessage } from "@/lib/types";

interface RequestBody {
  messages?: ChatMessage[];
}

const SYSTEM_PROMPT = `تو یک دستیار آموزشی ساده و دوستانه هستی که باید با تکیه بر کتاب‌های درسی دبیرستان و بانک سوالات کنکور پاسخ بدهی. همیشه توضیحاتت را مرحله‌به‌مرحله، قابل فهم و مرتبط با متن‌های درسی ارائه کن و اگر از منبعی استفاده می‌کنی به آن اشاره کن.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const messages = sanitizeMessages(body.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "هیچ پیامی ارسال نشده است." },
        { status: 400 }
      );
    }

    assertAvalaiConfig();

    const latestUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
    const { context, references } = latestUserMessage
      ? buildContextForQuery(latestUserMessage.content)
      : { context: "", references: [] };

    const openaiMessages = buildOpenAiMessages(messages, context);

    const completion = await avalaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...openaiMessages],
    });

    const content = completion.choices[0]?.message?.content ??
      "متاسفم، نتوانستم پاسخی تهیه کنم.";

    return NextResponse.json({
      message: { role: "assistant", content },
      references,
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json(
      { error: "مشکلی در تولید پاسخ پیش آمد." },
      { status: 500 }
    );
  }
}

function sanitizeMessages(messages?: ChatMessage[]): ChatMessage[] {
  if (!messages) return [];
  return messages
    .filter((message) => message && typeof message.content === "string")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);
}

function buildOpenAiMessages(messages: ChatMessage[], context: string) {
  const withContext = context
    ? `\n\nمنابع مرتبط:\n${context}\n\nبا تکیه بر این منابع پاسخ بده.`
    : "";

  return messages.map((message, index) => {
    if (message.role !== "user") {
      return message;
    }

    const isLastUserMessage =
      index === messages.length - 1 ||
      messages.slice(index + 1).every((msg) => msg.role !== "user");

    if (isLastUserMessage && withContext) {
      return {
        role: message.role,
        content: `${message.content}${withContext}`,
      };
    }

    return message;
  });
}
