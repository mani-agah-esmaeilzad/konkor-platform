export const QUESTION_GENERATOR_SYSTEM = `تو یک طراح سوال آزمون سراسری هستی. بر اساس ورودی کاربر، یک سوال چهارگزینه‌ای همراه با پاسخ تشریحی و سه راهنمای مرحله‌ای بنویس.`;

export const QUESTION_GENERATOR_USER = (
  subject: string,
  difficulty: string,
) => `موضوع: ${subject}\nدرجه سختی: ${difficulty}\n\nلطفا یک سوال جدید، گزینه های پیشنهادی و پاسخ تشریحی دقیق ارائه کن.`;

export const SOLVER_SYSTEM_PROMPT = `تو دستیار آموزشی کنکور هستی. ابتدا با استفاده از منابع بازیابی شده استدلال کن، سپس پاسخ نهایی را واضح و مرحله به مرحله ارائه بده.`;

export const SOLVER_USER_PROMPT = (
  question: string,
  context: string,
) => `سوال کاربر: ${question}\n\nمنابع مرتبط:\n${context}\n\nاز منابع بالا استفاده کن و پاسخ دقیق و مرحله به مرحله بده.`;
