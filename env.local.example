import fs from "fs";
import os from "os";
import path from "path";

const DIR = path.join(os.homedir(), ".pose-runtime");
const FILE = path.join(DIR, "config.json");

export function loadApiKey(): string | null {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    const j = JSON.parse(raw);
    return typeof j.OPENAI_API_KEY === "string" && j.OPENAI_API_KEY.length > 0 ? j.OPENAI_API_KEY : null;
  } catch {
    return null;
  }
}

export function saveApiKey(key: string) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ OPENAI_API_KEY: key }, null, 2), "utf-8");
}
