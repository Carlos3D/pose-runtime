import OpenAI from "openai";
import { loadApiKey } from "@/lib/config";

export function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY || loadApiKey();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY. Set it in the app (Settings) or via .env.local.");
  }
  return new OpenAI({ apiKey: key });
}
