import { spawn } from "node:child_process";

const spawnOpts = { stdio: ["ignore", "inherit", "inherit"] };

const spawnNpm = (args) => {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/c", "npm", ...args], spawnOpts);
  }
  return spawn("npm", args, spawnOpts);
};

const children = [
  spawnNpm(["run", "server:mock:full"]),
  spawnNpm(["run", "dev:web"]),
];

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
};

for (const child of children) {
  child.on("error", (err) => {
    console.error(err);
    shutdown();
    process.exit(1);
  });
  child.on("exit", (code) => {
    if (shuttingDown) return;
    shutdown();
    process.exit(code ?? 0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
