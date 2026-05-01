import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "@playwright/test";

const port = Number(process.env.PORT || await getPort(4173));
const url = `http://127.0.0.1:${port}`;

function getPort(preferredPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (candidate) => {
      if (candidate > preferredPort + 40) {
        reject(new Error("No available local port found for profile capture."));
        return;
      }
      const server = createServer();
      server.once("error", () => tryPort(candidate + 1));
      server.once("listening", () => {
        server.close(() => resolve(candidate));
      });
      server.listen(candidate, "127.0.0.1");
    };
    tryPort(preferredPort);
  });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...options
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function startServer() {
  const child = spawn("npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, PORT: String(port) }
  });
  return child;
}

async function waitForServer(timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

await mkdir("assets", { recursive: true });
await mkdir("output/playwright", { recursive: true });
await run("node", ["scripts/update-profile-data.mjs"]);
await run("npx", ["next", "build"]);

const server = startServer();
try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 1
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "assets/profile-atlas.png", fullPage: true });
  await page.screenshot({ path: "output/playwright/profile-atlas.png", fullPage: true });
  await browser.close();
  await run("node", ["scripts/write-readme.mjs"]);
} finally {
  server.kill();
}
