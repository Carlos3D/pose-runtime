"use client";

import { useEffect, useMemo, useState } from "react";

type ApiState = any;

const GRID_CELLS = ["A1","A2","A3","A4","A5","A6","A7","A8","A9"] as const;

export default function Home() {
  const [state, setState] = useState<ApiState | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [log, setLog] = useState<any[]>([]);
  const [command, setCommand] = useState("");

  async function refresh() {
    const res = await fetch("/api/init");
    const json = await res.json();
    setState(json.state);
    setHasKey(!!json.hasKey);
  }

  useEffect(() => { refresh(); }, []);

  const suggestedCommand = useMemo(() => {
    const st = state?.currentStage;
    const map: Record<string, string> = {
      STAGE_0: "Proceed to STAGE 1 — EXTRACT POSE (IMAGE A)",
      STAGE_1: "Proceed to STAGE 1.25 — POSE EXTRACTION VISUALIZATION",
      STAGE_1_25: "Proceed to STAGE 1.5 — POSE VALIDATION GATE",
      STAGE_1_5: "Proceed to STAGE 2 — POSE VARIATION GRID (A1–A9)",
      STAGE_2: "Proceed to STAGE 3 — POSE SELECTION GATE",
      STAGE_3: "Proceed to STAGE 4 — POSE ISOLATION (SINGLE OUTPUT)"
    };
    return map[st] ?? "";
  }, [state]);

  useEffect(() => {
    if (!command && suggestedCommand) setCommand(suggestedCommand);
  }, [suggestedCommand, command]);

  async function upload(endpoint: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: fd });
    const json = await res.json();
    setLog(l => [...l, { endpoint, json }]);
    if (json?.state) setState(json.state);
  }

  async function proceed() {
    const res = await fetch("/api/proceed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });
    const json = await res.json();
    setLog(l => [...l, { proceed: command, json }]);
    if (json?.state) setState(json.state);
    if (json?.step?.next_required_user_command) setCommand(json.step.next_required_user_command);
  }

  async function selectPose(selection: string) {
    const res = await fetch("/api/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection })
    });
    const json = await res.json();
    setLog(l => [...l, { select: selection, json }]);
    if (json?.state) setState(json.state);
  }

  async function saveKey() {
    const res = await fetch("/api/set-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKeyInput.trim() })
    });
    const json = await res.json();
    setLog(l => [...l, { setKey: true, json }]);
    await refresh();
  }

  const latest = log.length ? log[log.length - 1]?.json : null;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1050, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Pose Runtime (Electron-ready)</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        No terminal needed after packaging. The app stores your API key locally.
      </p>

      {!hasKey && (
        <section style={{ marginTop: 12, padding: 12, border: "1px solid #f0c", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Step 0 — Add your OpenAI API key (one time)</h3>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            Paste your key below. It will be saved locally on your PC in: <code>~/.pose-runtime/config.json</code>
          </div>
          <input
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder="sk-..."
            style={{ width: "100%", padding: 10 }}
          />
          <button onClick={saveKey} style={{ marginTop: 8, padding: 10 }}>
            Save Key
          </button>
        </section>
      )}

      <section style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
        <div style={{ flex: "1 1 280px", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>1) Upload PDF</h3>
          <input type="file" accept="application/pdf"
            onChange={e => e.target.files?.[0] && upload("/api/upload-pdf", e.target.files[0])} />
        </div>

        <div style={{ flex: "1 1 280px", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>2) Upload Image A</h3>
          <input type="file" accept="image/*"
            onChange={e => e.target.files?.[0] && upload("/api/upload-image-a", e.target.files[0])} />
        </div>

        <div style={{ flex: "2 1 360px", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>3) Proceed</h3>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Current stage: <b>{state?.currentStage ?? "..."}</b>
          </div>
          <input
            value={command}
            onChange={e => setCommand(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
          <button onClick={proceed} style={{ marginTop: 8, padding: 10 }}>
            Proceed
          </button>
          {suggestedCommand && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Suggested: {suggestedCommand}
            </div>
          )}
        </div>
      </section>

      {state?.currentStage === "STAGE_3" && (
        <section style={{ marginTop: 18, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>STAGE 3 — Select Pose Source</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GRID_CELLS.map(c => (
              <button key={c} onClick={() => selectPose(c)} style={{ padding: "8px 10px" }}>
                Use {c}
              </button>
            ))}
            <button onClick={() => selectPose("custom")} style={{ padding: "8px 10px" }}>
              Use Custom Upload
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              If using custom: upload it here:
            </div>
            <input type="file" accept="image/*"
              onChange={e => e.target.files?.[0] && upload("/api/upload-custom-pose", e.target.files[0])} />
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            Current selection: <b>{state?.selection ? JSON.stringify(state.selection) : "none"}</b>
          </div>
        </section>
      )}

      {latest?.imageDataUrl && (
        <section style={{ marginTop: 18 }}>
          <h3>Latest Image Output</h3>
          <img
            src={latest.imageDataUrl}
            alt="output"
            style={{ maxWidth: "100%", border: "1px solid #ddd", borderRadius: 8 }}
          />
        </section>
      )}

      <section style={{ marginTop: 18 }}>
        <h3>Log</h3>
        <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, overflow: "auto" }}>
{JSON.stringify(log, null, 2)}
        </pre>
      </section>
    </main>
  );
}
