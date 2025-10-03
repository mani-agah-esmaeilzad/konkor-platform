"use client";

import { useState } from "react";
import type { SolveResponse } from "@/lib/types";

interface RetrievedReference {
  subject: string;
  topic: string;
  source: string;
}

export function QuestionSolver() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/questions/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error("حل سوال با شکست مواجه شد. دوباره تلاش کنید.");
      }

      const data = (await response.json()) as SolveResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "مشکلی رخ داده است");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <h2>حل سوال با RAG</h2>
      <p className="description">
        سوال خود را بنویسید تا ابتدا با استفاده از مخزن دانش، مطالب مرتبط بازیابی شود و سپس مدل آوال‌ای‌آی با
        استدلال مرحله‌ای پاسخ تشریحی ارائه دهد.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="question">متن سوال</label>
        <textarea
          id="question"
          placeholder="سوال خود را اینجا بنویسید"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
        />

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "در حال پردازش..." : "حل سوال"}
        </button>
      </form>

      {error ? <p style={{ color: "#fca5a5", marginTop: "1rem" }}>{error}</p> : null}

      {result ? (
        <div className="response-box" style={{ marginTop: "1.5rem" }}>
          <strong>استدلال مدل:</strong>
          <p style={{ marginTop: "0.5rem", lineHeight: 1.75 }}>{result.reasoning}</p>
          <strong style={{ display: "block", marginTop: "1rem" }}>پاسخ نهایی:</strong>
          <p style={{ marginTop: "0.5rem" }}>{result.answer}</p>
          {result.references?.length ? (
            <div style={{ marginTop: "1rem" }}>
              <strong>منابع بازیابی شده:</strong>
              <ul>
                {result.references.map((ref: RetrievedReference, index) => (
                  <li key={`${ref.subject}-${ref.topic}-${index}`}>
                    {ref.subject} / {ref.topic} — {ref.source}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
