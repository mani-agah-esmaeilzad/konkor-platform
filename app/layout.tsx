import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "دستیار ساده کنکور",
  description:
    "چت‌بات مینیمال فارسی برای پاسخ‌گویی به سوالات درسی و تست‌های کنکور با استفاده از AvalAI",
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
