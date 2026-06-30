#!/usr/bin/env node
/**
 * Build script for Vercel.
 * prisma generate is already run by postinstall, so we skip it here.
 * prisma migrate deploy only runs when DATABASE_URL is available.
 */
import { execSync } from "child_process";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL found — running prisma migrate deploy");
  run("npx prisma migrate deploy");
} else {
  console.log("DATABASE_URL not set — skipping migrate deploy");
}

run("npx next build");
