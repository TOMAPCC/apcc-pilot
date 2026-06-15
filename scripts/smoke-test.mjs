import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const crmSource = readFileSync(new URL("../lib/crm.ts", import.meta.url), "utf8");
const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

assert.match(crmSource, /findPotentialDuplicate/);
assert.match(crmSource, /parseCsvLeads/);
assert.match(schema, /model Prospect/);
assert.match(schema, /model Worksite/);
assert.match(schema, /model Connector/);

console.log("Smoke tests passed: core CRM services and Prisma schema are present.");
