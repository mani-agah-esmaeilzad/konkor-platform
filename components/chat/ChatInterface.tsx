"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, ReferenceSource } from "@/lib/types";

const SUGGESTED_PROMPTS: string[] = [
  "یک جمع بندی سریع از نکات مهم فصل تابع ریاضی دهم بده.",
  "چند تست مفهومی فیزیک درباره حرکت پرتابی پیشنهاد کن و راه حل‌شان را هم بگو.",
  "گام به گام حل یک سوال زیست شناسی درباره تنفس سلولی را توضیح بده.",
  "برای مطالعه ترکیبی شیمی آلی و معدنی چه برنامه‌ای پیشنهاد می‌کنی؟",
];

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "سلام! من دستیار آموزشی کنکور هستم. می‌توانی هر سوالی درباره کتاب‌های درسی یا تست‌های کنکور بپرسی تا با تکیه بر منابع درسی و بانک سوالات همراهت باشم.",
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [pendingInput, setPendingInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [references, setReferences] = useState<ReferenceSource[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading]);

  const canSend = useMemo(() => pendingInput.trim().length > 0 && !isLoading, [
    pendingInput,
    isLoading,
  ]);

  async function sendPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setPendingInput("");
    setIsLoading(true);
    setReferences([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("خطا در برقراری ارتباط با سرور");
      }

      const payload = (await response.json()) as {
        message: ChatMessage;
        references: ReferenceSource[];
      };

      setMessages((prev) => [...prev, payload.message]);
      setReferences(payload.references);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "متاسفم، در حال حاضر نمی‌توانم پاسخ بدهم. لطفا بعدا دوباره امتحان کن یا اتصال اینترنت را بررسی کن.",
        },
      ]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendPrompt(pendingInput);
  }

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <div>
          <h1>دستیار ساده کنکور</h1>
          <p>
            سوالت را همین حالا بنویس یا از پرامپت‌های پیشنهادی استفاده کن تا به
            منابع درسی و بانک تست‌ها دسترسی داشته باشی.
          </p>
        </div>
      </header>

      <section className="suggestion-panel" aria-label="پرامپت‌های پیشنهادی">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="suggestion-chip"
            onClick={() => sendPrompt(prompt)}
            disabled={isLoading}
          >
            {prompt}
          </button>
        ))}
      </section>

      <div ref={listRef} className="message-list" aria-live="polite">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`message-bubble ${message.role}`}
          >
            <span className="role-label">
              {message.role === "user" ? "کاربر" : "دستیار"}
            </span>
            <p>{message.content}</p>
          </article>
        ))}
        {isLoading ? (
          <article className="message-bubble assistant typing">
            <span className="role-label">دستیار</span>
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </article>
        ) : null}
      </div>

      {references.length > 0 ? (
        <aside className="reference-panel" aria-label="منابع استفاده شده">
          <h2>منابع مرتبط</h2>
          <ul>
            {references.map((ref) => (
              <li key={`${ref.subject}-${ref.topic}-${ref.source}`}>
                <span>{ref.subject}</span>
                <span>{ref.topic}</span>
                <span>{ref.source}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          value={pendingInput}
          onChange={(event) => setPendingInput(event.target.value)}
          placeholder="سوال یا درخواستت را اینجا بنویس..."
          rows={2}
          dir="rtl"
        />
        <button type="submit" disabled={!canSend}>
          ارسال
        </button>
      </form>
    </div>
  );
}
