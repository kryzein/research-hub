import { execSync } from "child_process";

// Use the script's directory to find the project root (one level up from scripts/)
const projectRoot = new URL("..", import.meta.url).pathname;

console.log("Project root:", projectRoot);

// Remove any stale lockfiles
try {
  execSync("rm -f package-lock.json pnpm-lock.yaml bun.lockb", { cwd: projectRoot, stdio: "inherit" });
  console.log("Removed stale lockfiles");
} catch (e) {
  console.log("No lockfiles to remove");
}

// Generate fresh package-lock.json
try {
  execSync("npm install --package-lock-only --legacy-peer-deps", { cwd: projectRoot, stdio: "inherit", timeout: 120000 });
  console.log("Successfully generated package-lock.json");
} catch (e) {
  console.error("npm install failed, trying alternative approach...");
  // If that fails, try without legacy-peer-deps
  try {
    execSync("npm install --package-lock-only", { cwd: projectRoot, stdio: "inherit", timeout: 120000 });
    console.log("Successfully generated package-lock.json (alternative)");
  } catch (e2) {
    console.error("All approaches failed:", e2.message);
  }
}
