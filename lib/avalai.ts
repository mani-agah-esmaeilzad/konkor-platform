import OpenAI from "openai";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`متغیر محیطی ${name} تنظیم نشده است.`);
  }
  return value;
}

export const avalaiClient = new OpenAI({
  apiKey: process.env.AVALAI_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://api.avalai.ir/v1",
});

export function assertAvalaiConfig() {
  if (!(process.env.AVALAI_API_KEY ?? process.env.OPENAI_API_KEY)) {
    requireEnv("AVALAI_API_KEY");
  }
}
