-- CreateTable: CoproScan B2B module

CREATE TABLE "Syndic" (
    "id" TEXT NOT NULL,
    "siren" TEXT,
    "siret" TEXT,
    "name" TEXT NOT NULL,
    "brandName" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "enrichedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "gdprOpposedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Syndic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Copropriete" (
    "id" TEXT NOT NULL,
    "rnicId" TEXT,
    "bdnbId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lotsCount" INTEGER,
    "lotsResidential" INTEGER,
    "constructionYear" INTEGER,
    "heatingType" TEXT,
    "heatingCollective" BOOLEAN,
    "energyClass" TEXT,
    "classificationStatus" TEXT NOT NULL DEFAULT 'unknown',
    "classificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "classificationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "dataOrigin" TEXT NOT NULL DEFAULT 'rnic',
    "sourceType" TEXT NOT NULL DEFAULT 'public',
    "gdprOpposedAt" TIMESTAMP(3),
    "syndicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Copropriete_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Batiment" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "bdnbBatId" TEXT,
    "address" TEXT,
    "constructionYear" INTEGER,
    "surfaceHabitable" DOUBLE PRECISION,
    "lotsCount" INTEGER,
    "heatingType" TEXT,
    "dpeLabel" TEXT,
    "dpeRef" TEXT,
    "dpeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batiment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT NOT NULL,
    "role" TEXT,
    "emailPro" TEXT,
    "phonePro" TEXT,
    "linkedinUrl" TEXT,
    "contactStatus" TEXT NOT NULL DEFAULT 'enrichment_required',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "sourceProvider" TEXT,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gdprOpposedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactProof" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "rawData" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactProof_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DpeProof" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "ademeRef" TEXT,
    "energyClass" TEXT NOT NULL,
    "dpeScore" DOUBLE PRECISION,
    "gesScore" DOUBLE PRECISION,
    "scope" TEXT NOT NULL,
    "isCollective" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "millesime" INTEGER,
    "matchMethod" TEXT,
    "matchConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DpeProof_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EnergyProof" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "proofType" TEXT NOT NULL,
    "value" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceRef" TEXT,
    "millesime" INTEGER,
    "proofDate" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyProof_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClayJob" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "webhookUrl" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestPayload" JSONB,
    "resultPayload" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "gdprBasis" TEXT NOT NULL DEFAULT 'legitimate_interest_b2b',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClayJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT,
    "syndicId" TEXT,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "subjectVariants" JSONB,
    "claims" JSONB,
    "draftStatus" TEXT NOT NULL DEFAULT 'generated',
    "followUpJ4" TEXT,
    "followUpJ9" TEXT,
    "followUpJ15" TEXT,
    "proposedSlots" JSONB,
    "bookingUrl" TEXT,
    "oppositionCheckedAt" TIMESTAMP(3),
    "gmailDraftId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT,
    "syndicId" TEXT,
    "contactId" TEXT,
    "type" TEXT NOT NULL,
    "direction" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recordsTotal" INTEGER NOT NULL DEFAULT 0,
    "recordsImported" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsRejected" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorLog" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportRejection" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "field" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRejection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GdprLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GdprLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OppositionList" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "siren" TEXT,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "opposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OppositionList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Syndic_siren_key" ON "Syndic"("siren");
CREATE UNIQUE INDEX "Copropriete_rnicId_key" ON "Copropriete"("rnicId");
CREATE UNIQUE INDEX "ClayJob_idempotencyKey_key" ON "ClayJob"("idempotencyKey");

CREATE INDEX "Syndic_name_idx" ON "Syndic"("name");
CREATE INDEX "Copropriete_department_idx" ON "Copropriete"("department");
CREATE INDEX "Copropriete_classificationStatus_idx" ON "Copropriete"("classificationStatus");
CREATE INDEX "Copropriete_energyClass_idx" ON "Copropriete"("energyClass");
CREATE INDEX "Copropriete_isDemo_idx" ON "Copropriete"("isDemo");
CREATE INDEX "ClayJob_status_idx" ON "ClayJob"("status");
CREATE INDEX "ClayJob_syndicId_idx" ON "ClayJob"("syndicId");
CREATE INDEX "OppositionList_email_idx" ON "OppositionList"("email");
CREATE INDEX "OppositionList_siren_idx" ON "OppositionList"("siren");

-- AddForeignKey
ALTER TABLE "Copropriete" ADD CONSTRAINT "Copropriete_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Batiment" ADD CONSTRAINT "Batiment_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContactProof" ADD CONSTRAINT "ContactProof_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DpeProof" ADD CONSTRAINT "DpeProof_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EnergyProof" ADD CONSTRAINT "EnergyProof_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClayJob" ADD CONSTRAINT "ClayJob_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportRejection" ADD CONSTRAINT "ImportRejection_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
