# Plan de Migrations APCC Pilot

## Regle Absolue

La migration `prisma/migrations/0001_initial/migration.sql` a ete appliquee en production. Elle ne doit plus etre modifiee.

Toute evolution doit etre creee dans une nouvelle migration.

## Etat Actuel

Schema existant large, mais certaines entites ne sont pas encore exploitees par l'UI:
- roles/permissions;
- opportunities/pipeline stages;
- automations;
- quotes;
- worksites;
- invoices/payments;
- documents basiques;
- audit logs.

## Migrations Proposees Phase 1

### 0002_phase1_foundation

Objectif: socle campagne, pipeline simplifie, activites et preferences utilisateur.

Ajouts proposes:

#### Campaign

- id
- name
- status
- businessLine
- source
- startsAt
- endsAt
- active
- ownerId
- createdAt
- updatedAt

#### Prospect

Ajouter:
- campaignId nullable;
- pipelineStageKey;
- subStatus;
- lostReason;
- lostComment;
- lostCompetitor;
- lostAmount;
- reactivationDate;
- lastContactedAt;
- contactAttempts.

Ne pas supprimer `status`; garder une periode de compatibilite.

#### Activity

- id
- entityType
- entityId
- prospectId nullable
- clientId nullable
- campaignId nullable
- type
- channel
- direction
- body
- metadata JSON
- createdById nullable
- createdAt

#### WorkQueueView ou SavedView

Pour vues enregistrees:
- id
- name
- ownerId
- scope
- filters JSON
- createdAt
- updatedAt

#### UserPreference

- id
- userId
- key
- value JSON

### Donnees Initiales

Creer une campagne par defaut:
- `Campagne historique APCC`
- status `ACTIVE`
- active `true`

Backfill:
- rattacher tous les prospects existants a cette campagne;
- mapper les statuts actuels vers `pipelineStageKey`;
- initialiser `subStatus` lorsque possible.

## Migrations Phase 2

- CallLog
- CommunicationThread
- CommunicationMessage
- MessageTemplate
- Consent
- Suppression / STOP list
- Sequence
- SequenceStep
- SequenceExecution

## Migrations Phase 4 Documents

- DocumentFolder
- DocumentVersion
- DocumentAccessGrant
- DocumentChecklist
- DocumentRequirement
- DocumentRequest

Le champ `Document.path` actuel devra pointer vers un stockage prive, pas vers un Data URL.

## Verification Migration

Avant application:
- `DATABASE_URL=... npx prisma validate`
- `npx prisma migrate diff`
- test sur base preview;
- backup Neon si operation risquee.

Apres application:
- `npx prisma migrate deploy`
- smoke tests;
- verification lecture prospects/clients;
- verification creation prospect;
- verification validation client.
