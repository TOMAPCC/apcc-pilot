#!/usr/bin/env node
/**
 * Build script for Vercel.
 *
 * postinstall runs `prisma generate || true` which silently swallows failures.
 * We check here if the client was actually produced and regenerate if needed.
 * prisma migrate deploy runs only when DATABASE_URL is available.
 */
import { execSync } from "child_process";
import { existsSync } from "fs";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

const clientFile = "node_modules/.prisma/client/default.js";

if (existsSync(clientFile)) {
  console.log("Prisma client already generated — skipping prisma generate");
} else {
  console.log("Prisma client not found — running prisma generate");
  run("npx prisma generate");
}

if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL found — running prisma migrate deploy");
  try {
    run("npx prisma migrate deploy");
  } catch (e) {
    console.error("⚠️  prisma migrate deploy failed (non-fatal — investigate separately):", e.message);
  }
} else {
  console.log("DATABASE_URL not set — skipping migrate deploy");
}

run("npx next build");
