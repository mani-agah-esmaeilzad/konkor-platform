import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AvalAI Exam Assistant",
  description:
    "دستیار آموزشی با استفاده از RAG و LangChain برای تولید، مرور و حل سوالات کنکور",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
