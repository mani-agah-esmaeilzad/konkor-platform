"use client";

import { useEffect, useState } from "react";
import type { SampleQuestion } from "@/lib/types";

export function SampleQuestions() {
  const [questions, setQuestions] = useState<SampleQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/questions/sample");
        if (!response.ok) {
          throw new Error("نمونه سوالات بارگذاری نشد");
        }
        const data = (await response.json()) as SampleQuestion[];
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "مشکلی پیش آمده است");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <section className="section">
      <h2>نمونه سوالات منتخب</h2>
      <p className="description">
        مجموعه‌ای از پرسش‌های مهم کنکور به همراه پاسخ تشریحی برای مرور سریع.
      </p>

      {loading ? <p>در حال بارگذاری...</p> : null}
      {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}

      {!loading && !error ? (
        <div className="card-grid">
          {questions.map((question, index) => (
            <article className="card" key={`${question.subject}-${index}`}>
              <div className="badge" style={{ alignSelf: "flex-start" }}>
                {question.subject} • {question.difficulty}
              </div>
              <h3>{question.topic}</h3>
              <p>{question.question}</p>
              {question.explanation ? (
                <details style={{ marginTop: "auto" }}>
                  <summary>نمایش پاسخ</summary>
                  <p style={{ marginTop: "0.75rem" }}>{question.explanation}</p>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
