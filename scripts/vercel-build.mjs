#!/usr/bin/env node
import { execSync } from "child_process";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

run("npx prisma generate");

if (process.env.DATABASE_URL) {
  run("npx prisma migrate deploy");
} else {
  console.log("DATABASE_URL not set — skipping migrate deploy (build-only environment)");
}

run("npx next build");
