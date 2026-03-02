import { execSync } from "child_process";

try {
  console.log("Running npm install to generate fresh package-lock.json...");
  execSync("cd /vercel/share/v0-project && npm install --package-lock-only --legacy-peer-deps", {
    stdio: "inherit",
    timeout: 120000,
  });
  console.log("package-lock.json generated successfully!");
} catch (error) {
  console.error("npm install failed:", error.message);
  process.exit(1);
}
