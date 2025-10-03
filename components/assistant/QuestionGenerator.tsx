"use client";

import { useState } from "react";
import type { GeneratedQuestion } from "@/lib/types";

interface Props {
  initialDifficulty?: string;
}

export function QuestionGenerator({ initialDifficulty = "متوسط" }: Props) {
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, difficulty }),
      });

      if (!response.ok) {
        throw new Error("خطا در تولید سوال. لطفا دوباره تلاش کنید.");
      }

      const data = (await response.json()) as GeneratedQuestion;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "مشکلی پیش آمده است");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <h2>تولید سوال جدید</h2>
      <p className="description">
        عنوان درس یا مبحث مورد نظر را وارد کنید تا مدل با توجه به درجه سختی انتخابی، سوال چهارگزینه‌ای جدید
        به همراه پاسخ تشریحی و راهنماهای مرحله‌ای ایجاد کند.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="subject">موضوع یا مبحث</label>
        <input
          id="subject"
          placeholder="مثلا: استوکیومتری، گسسته، دینامیک"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />

        <label htmlFor="difficulty">درجه سختی</label>
        <select id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="آسان">آسان</option>
          <option value="متوسط">متوسط</option>
          <option value="دشوار">دشوار</option>
        </select>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "در حال تولید..." : "ساخت سوال"}
        </button>
      </form>

      {error ? <p style={{ color: "#fca5a5", marginTop: "1rem" }}>{error}</p> : null}

      {result ? (
        <div className="response-box" style={{ marginTop: "1.5rem" }}>
          <strong>سوال:</strong>
          <br />
          {result.question}
          <br />
          <br />
          <strong>پاسخ تشریحی:</strong>
          <br />
          {result.answer}
          <br />
          <br />
          <strong>راهنماها:</strong>
          <ul>
            {(result.hints ?? []).map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
