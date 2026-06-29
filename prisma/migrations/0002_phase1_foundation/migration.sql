-- Phase 1 foundation: campaign context, canonical pipeline, activity history and saved views.
-- Non destructive migration: keeps 0001 intact and backfills existing prospects.

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "prospectId" TEXT,
    "clientId" TEXT,
    "campaignId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT,
    "direction" TEXT,
    "body" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT,
    "scope" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Prospect"
ADD COLUMN "campaignId" TEXT,
ADD COLUMN "pipelineStageKey" TEXT,
ADD COLUMN "subStatus" TEXT,
ADD COLUMN "lostReason" TEXT,
ADD COLUMN "lostComment" TEXT,
ADD COLUMN "lostCompetitor" TEXT,
ADD COLUMN "lostAmount" DECIMAL(65,30),
ADD COLUMN "reactivationDate" TIMESTAMP(3),
ADD COLUMN "lastContactedAt" TIMESTAMP(3),
ADD COLUMN "contactAttempts" INTEGER NOT NULL DEFAULT 0;

-- Seed default active campaign for historical data.
INSERT INTO "Campaign" ("id", "name", "status", "active", "description", "createdAt", "updatedAt")
VALUES (
  'campaign-historique-apcc',
  'Campagne historique APCC',
  'ACTIVE',
  true,
  'Campagne de reprise pour les leads importes avant la structuration multi-campagnes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Backfill campaign and canonical pipeline stage.
UPDATE "Prospect"
SET
  "campaignId" = COALESCE("campaignId", 'campaign-historique-apcc'),
  "pipelineStageKey" = COALESCE(
    "pipelineStageKey",
    CASE
      WHEN "status" IN ('Nouveau lead', 'A qualifier') THEN 'nouveau'
      WHEN "status" = 'A contacter' THEN 'a-contacter'
      WHEN "status" IN ('N''a pas repondu', 'Contact etabli') THEN 'contact-en-cours'
      WHEN "status" = 'Rendez-vous planifie' THEN 'rendez-vous'
      WHEN "status" = 'Devis envoye' THEN 'etude-proposition'
      WHEN "status" = 'Negociation' THEN 'negociation'
      WHEN "status" = 'Dossier signe' THEN 'gagne'
      WHEN "status" = 'Dossier perdu' THEN 'perdu'
      ELSE 'nouveau'
    END
  );

-- CreateIndex
CREATE INDEX "Campaign_active_idx" ON "Campaign"("active");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");
CREATE INDEX "Activity_prospectId_idx" ON "Activity"("prospectId");
CREATE INDEX "Activity_clientId_idx" ON "Activity"("clientId");
CREATE INDEX "Activity_campaignId_idx" ON "Activity"("campaignId");
CREATE INDEX "Activity_type_idx" ON "Activity"("type");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX "SavedView_ownerId_idx" ON "SavedView"("ownerId");
CREATE INDEX "SavedView_scope_idx" ON "SavedView"("scope");
CREATE UNIQUE INDEX "UserPreference_userId_key_key" ON "UserPreference"("userId", "key");
CREATE INDEX "Prospect_campaignId_idx" ON "Prospect"("campaignId");
CREATE INDEX "Prospect_pipelineStageKey_idx" ON "Prospect"("pipelineStageKey");
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");
CREATE INDEX "Prospect_nextFollowUp_idx" ON "Prospect"("nextFollowUp");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
