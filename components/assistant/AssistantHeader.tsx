export function AssistantHeader() {
  return (
    <header className="section" style={{ textAlign: "center", padding: "32px" }}>
      <div className="badge">دستیار کنکور آوال‌ای‌آی</div>
      <h1 style={{ fontSize: "2rem", marginTop: "1rem", marginBottom: "1rem" }}>
        پلتفرم هوشمند RAG برای طراحی و حل سوالات کنکور
      </h1>
      <p className="description" style={{ margin: "0 auto", maxWidth: "60ch" }}>
        این داشبورد با استفاده از LangChain و مدل‌های آوال‌ای‌آی سه جریان اصلی را پوشش می‌دهد:
        تولید سوال جدید، دسترسی سریع به نمونه سوالات منتخب و حل سوالات با بازیابی زمینه‌ای.
      </p>
    </header>
  );
}
