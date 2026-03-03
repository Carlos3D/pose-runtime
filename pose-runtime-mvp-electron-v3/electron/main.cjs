const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let nextProc = null;
const PORT = process.env.POSE_RUNTIME_PORT || "3100";
const URL = `http://localhost:${PORT}`;

function startNext() {
  const isDev = !app.isPackaged;

  // In dev we expect user runs next dev separately (handled by npm script)
  if (isDev) return;

  // In production, run `next start` using the packaged app's resources
  const nodeBin = process.execPath; // electron's node
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  nextProc = spawn(cmd, ["next", "start", "-p", PORT], {
    cwd: app.getAppPath(),
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "ignore"
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: {
      contextIsolation: true
    }
  });

  win.loadURL(URL);
}

app.whenReady().then(() => {
  startNext();

  // wait a moment for server boot (simple)
  setTimeout(() => {
    createWindow();
  }, 1500);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (nextProc) {
    try { nextProc.kill(); } catch {}
  }
  if (process.platform !== "darwin") app.quit();
});
