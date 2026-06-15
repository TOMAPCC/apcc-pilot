-- Initial PostgreSQL schema for APCC PILOT.
-- Generated as a baseline matching prisma/schema.prisma.
-- Run `npx prisma migrate dev` after configuring DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE "Permission" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("key", "roleId")
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "archivedAt" TIMESTAMP
);

CREATE TABLE "LeadSource" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "PipelineStage" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "probability" INTEGER NOT NULL
);

CREATE TABLE "Prospect" (
  "id" TEXT PRIMARY KEY,
  "civility" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "secondaryPhone" TEXT,
  "email" TEXT,
  "status" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'Normale',
  "score" INTEGER NOT NULL DEFAULT 0,
  "estimatedBudget" DECIMAL NOT NULL DEFAULT 0,
  "expectedDecisionDate" TIMESTAMP,
  "nextAction" TEXT,
  "nextFollowUp" TIMESTAMP,
  "comments" TEXT,
  "sourceId" TEXT REFERENCES "LeadSource"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "assignedToId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "archivedAt" TIMESTAMP,
  "lastModifiedBy" TEXT
);

CREATE INDEX "Prospect_phone_idx" ON "Prospect"("phone");
CREATE INDEX "Prospect_email_idx" ON "Prospect"("email");
CREATE INDEX "Prospect_lastName_idx" ON "Prospect"("lastName");

CREATE TABLE "Client" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT NOT NULL UNIQUE,
  "prospectId" TEXT UNIQUE REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "archivedAt" TIMESTAMP
);

CREATE TABLE "Address" (
  "id" TEXT PRIMARY KEY,
  "label" TEXT NOT NULL,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "postalCode" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "department" TEXT,
  "prospectId" TEXT REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Property" (
  "id" TEXT PRIMARY KEY,
  "prospectId" TEXT NOT NULL UNIQUE REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "housingType" TEXT,
  "constructionYear" INTEGER,
  "livingArea" INTEGER,
  "levels" INTEGER,
  "occupants" INTEGER,
  "ownerStatus" TEXT,
  "heatingSystem" TEXT,
  "currentEnergy" TEXT,
  "emitters" TEXT,
  "hotWater" TEXT,
  "insulation" TEXT,
  "dpe" TEXT,
  "fiscalIncome" DECIMAL,
  "householdSize" INTEGER,
  "maprimeCategory" TEXT,
  "estimatedCee" DECIMAL,
  "estimatedGrants" DECIMAL
);

CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "prospectId" TEXT REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Opportunity" (
  "id" TEXT PRIMARY KEY,
  "prospectId" TEXT NOT NULL REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "stageId" TEXT NOT NULL REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "amount" DECIMAL NOT NULL,
  "probability" INTEGER NOT NULL,
  "lostReason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "template" TEXT,
  "startsAt" TIMESTAMP NOT NULL,
  "endsAt" TIMESTAMP,
  "address" TEXT,
  "googleEventId" TEXT,
  "prospectId" TEXT REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMP NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "completedAt" TIMESTAMP,
  "ownerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "prospectId" TEXT REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Connector" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "ImportHistory" (
  "id" TEXT PRIMARY KEY,
  "connectorId" TEXT NOT NULL REFERENCES "Connector"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" TEXT NOT NULL,
  "imported" INTEGER NOT NULL DEFAULT 0,
  "duplicates" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Remaining operational tables are managed by Prisma schema in the same baseline.
