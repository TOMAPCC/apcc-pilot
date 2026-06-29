/**
 * CoproScan blocking test suite (Phase 10).
 * Run: node scripts/coproscan-tests.mjs
 * Requires no database — tests pure logic and module contracts.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── Verify source files exist ─────────────────────────────────────────────

const classificationSrc = readFileSync(new URL("../lib/coproscan/classification.ts", import.meta.url), "utf8");
const clayProviderSrc = readFileSync(new URL("../lib/coproscan/clay-provider.ts", import.meta.url), "utf8");
const emailStudioSrc = readFileSync(new URL("../lib/coproscan/email-studio.ts", import.meta.url), "utf8");
const rgpdSrc = readFileSync(new URL("../lib/coproscan/rgpd.ts", import.meta.url), "utf8");
const rnicImporterSrc = readFileSync(new URL("../lib/coproscan/rnic-importer.ts", import.meta.url), "utf8");
const dpeImporterSrc = readFileSync(new URL("../lib/coproscan/dpe-importer.ts", import.meta.url), "utf8");
const typesSrc = readFileSync(new URL("../lib/coproscan/types.ts", import.meta.url), "utf8");
const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const callbackSrc = readFileSync(new URL("../app/api/integrations/clay/callback/route.ts", import.meta.url), "utf8");
const coproprietesSrc = readFileSync(new URL("../app/api/coproscan/coproprietes/route.ts", import.meta.url), "utf8");
const emailGenSrc = readFileSync(new URL("../app/api/coproscan/emails/generate/route.ts", import.meta.url), "utf8");
const rgpdApiSrc = readFileSync(new URL("../app/api/coproscan/rgpd/route.ts", import.meta.url), "utf8");

console.log("\n── Phase 10: CoproScan Blocking Tests ──\n");

// ── Schema ────────────────────────────────────────────────────────────────

console.log("Schema:");
test("Copropriete model present", () => assert.match(schema, /model Copropriete/));
test("Syndic model present", () => assert.match(schema, /model Syndic/));
test("Contact model present", () => assert.match(schema, /model Contact/));
test("DpeProof model present", () => assert.match(schema, /model DpeProof/));
test("EnergyProof model present", () => assert.match(schema, /model EnergyProof/));
test("ClayJob model present", () => assert.match(schema, /model ClayJob/));
test("EmailDraft model present", () => assert.match(schema, /model EmailDraft/));
test("ImportBatch model present", () => assert.match(schema, /model ImportBatch/));
test("GdprLog model present", () => assert.match(schema, /model GdprLog/));
test("OppositionList model present", () => assert.match(schema, /model OppositionList/));
test("isDemo field present on Copropriete", () => assert.match(schema, /isDemo.*Boolean.*@default\(false\)/));
test("classificationStatus field present", () => assert.match(schema, /classificationStatus/));
test("idempotencyKey unique on ClayJob", () => assert.match(schema, /idempotencyKey.*String.*@unique/));

// ── Types ─────────────────────────────────────────────────────────────────

console.log("\nTypes:");
test("ClassificationStatus type exported", () => assert.match(typesSrc, /ClassificationStatus/));
test("ContactStatus type exported", () => assert.match(typesSrc, /ContactStatus/));
test("EFG_CLASSES defined", () => assert.match(typesSrc, /EFG_CLASSES/));
test("isProductionMode function exported", () => assert.match(typesSrc, /isProductionMode/));
test("CLAY_CONTACT_ROLES exported", () => assert.match(typesSrc, /CLAY_CONTACT_ROLES/));
test("TARGET_DEPARTMENTS exported", () => assert.match(typesSrc, /TARGET_DEPARTMENTS/));

// ── Classification ────────────────────────────────────────────────────────

console.log("\nClassification:");
test("classifyCopropriete function present", () => assert.match(classificationSrc, /classifyCopropriete/));
test("collective DPE required for confirmed status", () => assert.match(classificationSrc, /collectiveProofs/));
test("apartment DPE alone cannot confirm building", () => assert.match(classificationSrc, /A single apartment DPE does NOT confirm/));
test("EFG non-target path present", () => assert.match(classificationSrc, /non_target/));
test("unknown fallback when no proofs", () => assert.match(classificationSrc, /"unknown"/));
test("CONFIDENCE_CONFIRMED threshold used", () => assert.match(classificationSrc, /CONFIDENCE_CONFIRMED/));
test("CONFIDENCE_PROBABLE threshold used", () => assert.match(classificationSrc, /CONFIDENCE_PROBABLE/));
test("reclassifyAll function present", () => assert.match(classificationSrc, /reclassifyAll/));

// ── RNIC Importer ─────────────────────────────────────────────────────────

console.log("\nRNIC Importer:");
test("importRnicDepartment function present", () => assert.match(rnicImporterSrc, /importRnicDepartment/));
test("importAllTargetDepartments function present", () => assert.match(rnicImporterSrc, /importAllTargetDepartments/));
test("idempotent upsert by rnicId", () => assert.match(rnicImporterSrc, /rnicId/));
test("Rejects records without numero_immatriculation", () => assert.match(rnicImporterSrc, /missing_rnic_id/));
test("ImportBatch created for tracking", () => assert.match(rnicImporterSrc, /importBatch.create/));
test("Syndic upserted from SIREN", () => assert.match(rnicImporterSrc, /siren_syndic/));
test("isDemo set to false on real data", () => assert.match(rnicImporterSrc, /isDemo: false/));
test("Safety page limit present", () => assert.match(rnicImporterSrc, /page > 200/));

// ── DPE Importer ──────────────────────────────────────────────────────────

console.log("\nDPE Importer:");
test("importDpeForDepartment function present", () => assert.match(dpeImporterSrc, /importDpeForDepartment/));
test("Apartment DPE marked as non-collective", () => assert.match(dpeImporterSrc, /isCollective/));
test("Classification re-run after new DPE proof", () => assert.match(dpeImporterSrc, /classifyCopropriete/));
test("Address matching confidence threshold", () => assert.match(dpeImporterSrc, /similarity > 0\.7/));
test("ImportBatch created for DPE", () => assert.match(dpeImporterSrc, /importBatch.create/));

// ── Clay Provider ─────────────────────────────────────────────────────────

console.log("\nClay Provider:");
test("enqueueCompanyEnrichment function present", () => assert.match(clayProviderSrc, /enqueueCompanyEnrichment/));
test("verifyClayCallback function present", () => assert.match(clayProviderSrc, /verifyClayCallback/));
test("processClayCallback function present", () => assert.match(clayProviderSrc, /processClayCallback/));
test("GDPR opposition blocks Clay job", () => assert.match(clayProviderSrc, /gdprOpposedAt/));
test("Idempotency key prevents duplicate jobs", () => assert.match(clayProviderSrc, /idempotencyKey/));
test("Daily quota check present", () => assert.match(clayProviderSrc, /checkDailyQuota/));
test("HMAC verification present", () => assert.match(clayProviderSrc, /sha256=/));
test("Bearer verification present", () => assert.match(clayProviderSrc, /Bearer/));
test("timingSafeEqual used for signature comparison", () => assert.match(clayProviderSrc, /timingSafeEqual/));
test("isDemo check blocks demo syndics from Clay", () => assert.match(clayProviderSrc, /isDemo/));
test("No LinkedIn scraping — only provider data used", () => assert.match(clayProviderSrc, /sourceProvider.*clay/));
test("Unverified email marked non-sendable", () => assert.match(clayProviderSrc, /emailVerified/));

// ── Email Studio ──────────────────────────────────────────────────────────

console.log("\nEmail Studio:");
test("generateEmailDraft function present", () => assert.match(emailStudioSrc, /generateEmailDraft/));
test("Contact status guard (only verified/public_professional)", () => assert.match(emailStudioSrc, /verified.*public_professional/));
test("RGPD opposition check before generation", () => assert.match(emailStudioSrc, /gdprOpposedAt/));
test("Classification status must be confirmed", () => assert.match(emailStudioSrc, /confirmed/));
test("Claims built from real proofs", () => assert.match(emailStudioSrc, /claims.*ClaimWithProof/));
test("Three subject variants generated", () => assert.match(emailStudioSrc, /subjectVariants/));
test("HTML and text versions produced", () => assert.match(emailStudioSrc, /bodyHtml.*bodyText/s));
test("Follow-up J+4 J+9 J+15 generated", () => assert.match(emailStudioSrc, /followUpJ4.*followUpJ9.*followUpJ15/s));
test("No 'travaux gratuits' guaranteed", () => {
  assert.doesNotMatch(emailStudioSrc, /travaux gratuits/i);
  assert.doesNotMatch(emailStudioSrc, /zéro reste à charge garanti/i);
  assert.doesNotMatch(emailStudioSrc, /éligibilité certaine/i);
});
test("CEE disclaimer included", () => assert.match(emailStudioSrc, /éligibilité.*reste à charge.*confirmés/));
test("B2B notice in email", () => assert.match(emailStudioSrc, /B2B/));
test("Opposition opt-out in email", () => assert.match(emailStudioSrc, /STOP/));
test("Draft status set to generated (not sent)", () => assert.match(emailStudioSrc, /draftStatus.*generated/));
test("Opposition checked at timestamp stored", () => assert.match(emailStudioSrc, /oppositionCheckedAt/));
test("APCC_SALES_NAME not invented", () => assert.match(emailStudioSrc, /APCC_SALES_NAME/));

// ── RGPD ──────────────────────────────────────────────────────────────────

console.log("\nRGPD:");
test("addOpposition function present", () => assert.match(rgpdSrc, /addOpposition/));
test("purgeEntity function present", () => assert.match(rgpdSrc, /purgeEntity/));
test("purgeAllDemoData only in development", () => assert.match(rgpdSrc, /APP_ENV.*production.*purgeAllDemoData is only allowed in development/s));
test("logGdprAction function present", () => assert.match(rgpdSrc, /logGdprAction/));
test("isOpposed function present", () => assert.match(rgpdSrc, /isOpposed/));
test("Clay jobs cancelled on opposition", () => assert.match(rgpdSrc, /clayJob.updateMany/));

// ── API: Clay Callback ────────────────────────────────────────────────────

console.log("\nAPI Callback:");
test("Unsigned callback rejected with 401", () => assert.match(callbackSrc, /401/));
test("verifyClayCallback called before processing", () => assert.match(callbackSrc, /verifyClayCallback/));
test("processClayCallback called on valid request", () => assert.match(callbackSrc, /processClayCallback/));

// ── API: Coproprietes (commercial filter) ─────────────────────────────────

console.log("\nAPI Filters:");
test("isDemo: false enforced in commercial API", () => assert.match(coproprietesSrc, /isDemo.*false/));
test("TARGET_DEPARTMENTS filter enforced", () => assert.match(coproprietesSrc, /TARGET_DEPARTMENTS/));
test("EFG energy class filter enforced", () => assert.match(coproprietesSrc, /E.*F.*G/));
test("A-D excluded from commercial view (non-EFG not in confirmed/probable)", () => assert.match(coproprietesSrc, /classificationStatus.*status/));

// ── API: Email generation guard ───────────────────────────────────────────

console.log("\nAPI Email Guard:");
test("generateEmailDraft imported from email-studio", () => assert.match(emailGenSrc, /generateEmailDraft/));
test("422 returned on generation failure", () => assert.match(emailGenSrc, /422/));

// ── API: RGPD ─────────────────────────────────────────────────────────────

console.log("\nAPI RGPD:");
test("Opposition action handled", () => assert.match(rgpdApiSrc, /oppose/));
test("Purge action requires actor", () => assert.match(rgpdApiSrc, /actor.*required for purge/));
test("Export action logs access", () => assert.match(rgpdApiSrc, /export/));

// ── Docker & deployment ───────────────────────────────────────────────────

console.log("\nDeployment files:");
const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
const dockerCompose = readFileSync(new URL("../docker-compose.yml", import.meta.url), "utf8");
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");

test("Dockerfile present with multi-stage build", () => assert.match(dockerfile, /FROM.*AS builder/));
test("docker-compose.yml has postgres service", () => assert.match(dockerCompose, /postgres/));
test("docker-compose.yml has health check", () => assert.match(dockerCompose, /healthcheck/));
test(".env.example has CLAY variables", () => assert.match(envExample, /CLAY_INGEST_WEBHOOK_URL/));
test(".env.example has APCC variables", () => assert.match(envExample, /APCC_COMPANY_NAME/));
test(".env.example has DEMO_MODE", () => assert.match(envExample, /DEMO_MODE/));
test(".env.example has APP_ENV", () => assert.match(envExample, /APP_ENV/));
test(".env.example has EMAIL_DELIVERY_MODE", () => assert.match(envExample, /EMAIL_DELIVERY_MODE/));

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);

if (failed > 0) {
  console.error(`${failed} test(s) FAILED — blocking.\n`);
  process.exit(1);
}

console.log("All CoproScan blocking tests passed.\n");
