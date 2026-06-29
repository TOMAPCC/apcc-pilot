# Audit APCC Pilot

Date d'audit : 2026-06-29  
Application : APCC Pilot  
Depot local : `/Users/thomascauquil/Documents/CRM APCC`  
Projet Vercel : `tomappc-s-projects/apcc-pilot`

## Synthese

APCC Pilot est une application Next.js App Router deja deployee sur Vercel. L'interface CRM est utilisable pour consulter et qualifier des leads, principalement depuis Google Sheets et exports ClubTravaux. Le projet contient aussi un schema Prisma PostgreSQL assez large, mais l'application actuelle ne l'utilise pas comme source de verite operationnelle.

L'etat actuel est donc hybride :

- interface CRM moderne et fonctionnelle pour la consultation des prospects ;
- import live Google Sheets pour Pompes a chaleur et Prime Adapt ;
- import ClubTravaux code en dur depuis exports Excel successifs ;
- qualification locale via `localStorage` pour certains statuts, rendez-vous et modifications de fiches ;
- routes API de creation prospect, tache, rendez-vous surtout en simulation ;
- route Gmail server-side presente, avec variables OAuth Gmail configurees en production ;
- schema Prisma present, mais pas branche aux ecrans et sans preuve de base production active.

La premiere vraie migration doit donc connecter la persistance serveur avant d'ajouter des modules lourds comme GED, administratif, devis, facturation et chantiers.

## Stack identifiee

- Framework : Next.js `15.5.19`, App Router.
- UI : React `19`, CSS global maison dans `app/globals.css`.
- Langage : TypeScript.
- Validation : Zod.
- ORM prevu : Prisma `5.22`.
- Base prevue : PostgreSQL via `DATABASE_URL`.
- Deploiement : Vercel.
- Tests : script smoke test Node dans `scripts/smoke-test.mjs`.
- Auth : page login statique, pas d'authentification effective cote serveur.
- Stockage fichiers : aucun stockage prive actif. `.env.example` declare `STORAGE_PROVIDER=local`, ce qui n'est pas adapte a Vercel pour une GED.

## Arborescence fonctionnelle

Pages principales :

- `/` : tableau de bord, base sur prospects calcules a la volee.
- `/prospects` : liste, recherche, filtres, synchro Google Sheets.
- `/prospects/[id]` : fiche prospect editable, relance Gmail, qualification, rendez-vous local.
- `/pipeline` : Kanban commercial.
- `/appointments` : rendez-vous issus du stockage local navigateur.
- `/appointments/new` : creation en simulation Google Calendar.
- `/tasks` et `/tasks/new` : affichage vide et creation simulee.
- `/worksites` : affichage vide.
- `/login` : formulaire statique sans session.
- `/admin/connectors` : page connecteurs encore presente dans le code, meme si retiree de la navigation.

Routes API :

- `GET /api/prospects` : retourne les prospects calcules depuis Google Sheets et ClubTravaux.
- `POST /api/prospects` : valide le payload et detecte les doublons uniquement contre `lib/demo-data.ts`, puis retourne un message de simulation.
- `POST /api/gmail/send` : envoi Gmail via OAuth refresh token si les variables sont presentes.
- `POST /api/appointments` : valide un rendez-vous et retourne un statut simulation ou calendar-ready.
- `POST /api/tasks` : valide une tache, sans persistance.
- `POST /api/import/csv` : parse CSV et retourne une preview.
- `POST /api/connectors/webhook` : valide un lead webhook, sans persistance.

## Modele de donnees existant

Le schema Prisma contient deja des modeles utiles :

- `User`, `Role`, `Permission`
- `LeadSource`
- `Prospect`, `Client`, `Address`, `Property`, `Project`
- `Opportunity`, `PipelineStage`
- `Appointment`, `Task`, `Note`
- `EmailThread`, `EmailMessage`, `EmailTemplate`
- `Automation`, `AutomationExecution`
- `Quote`, `QuoteVersion`
- `GrantApplication`
- `Worksite`, `WorksitePhase`, `WorksiteReport`, `WorksitePhoto`, `Reservation`
- `Invoice`, `Payment`
- `Supplier`, `PurchaseOrder`
- `Subcontractor`, `Technician`
- `Equipment`, `EquipmentWarranty`
- `Document`
- `Notification`, `AuditLog`
- `Connector`, `ImportHistory`
- `SavRequest`

Limites importantes :

- `Document` est minimal : `name`, `path`, `mimeType`, liens prospect/client. Il ne couvre pas la GED demandee.
- `GrantApplication` est minimal et non relie au prospect/projet/client.
- `Quote`, `Invoice`, `Payment`, `Worksite` sont trop simples pour les statuts et workflows demandes.
- Il n'existe pas de modele unifie `BusinessFile` ou equivalent pour lier prospect/client/projet/chantier/copropriete.
- Aucun modele copropriete B2B n'existe.
- Aucun modele de version documentaire, demande de pieces, lien securise client ou access log n'existe.

## Fonctionnalites vraiment operationnelles

- Import live Google Sheets :
  - onglet Pompes a chaleur `gid=1926972254` ;
  - onglet Prime Adapt `gid=535542387`.
- Import ClubTravaux manuel code en dur dans `lib/clubtravaux-leads.ts`.
- Liste prospects avec recherche, filtres, tri, segmentation Pompes a chaleur / Prime Adapt.
- Fiche prospect editable cote client.
- Generation de mail closer HTML adapte Pompes a chaleur ou Prime Adapt.
- Route Gmail server-side prete pour l'envoi OAuth.
- Pipeline Kanban visuel.
- Creation locale de rendez-vous depuis une fiche prospect via `localStorage`.
- Sync bouton Google Sheets et refresh automatique cote page prospects.
- Build production OK.

## Fonctionnalites simulees ou non persistantes

- Authentification : page login statique, aucune session serveur.
- Roles/permissions : types et schema Prisma existent, mais non appliques aux routes.
- Creation prospect : renvoie un message, ne cree pas en base.
- Creation tache : renvoie un message, ne cree pas en base.
- Creation rendez-vous : renvoie un message, pas de Google Calendar reel ni base.
- Modifications de fiche : stockees dans `localStorage`, pas partagees entre appareils.
- Rendez-vous planifies : stockes dans `localStorage`.
- Pipeline : changements locaux uniquement, pas persistants serveur.
- Devis, facturation, chantiers, SAV : schemas partiels ou ecrans vides.
- GED : aucun upload reel, aucun stockage prive.
- Admin connecteurs : affichage informatif, pas une console de configuration complete.

## Donnees existantes a preserver

- Mapping Google Sheets actuel :
  - spreadsheet `1dFXhXlD3g7NU8H7HjJJ2V3B4n3GrhUFfWoUpYeVWNzA`
  - PAC `gid=1926972254`
  - Prime Adapt `gid=535542387`
  - logique `START_LEAD_LAST_NAME = Moktar Mazard`
- Imports ClubTravaux code en dur, actuellement 17 leads jusqu'a l'export du 24/06/2026.
- Identifiants synthetiques existants :
  - `sheet-pac-{rowNumber}`
  - `sheet-prime-adapt-{rowNumber}`
  - `clubtravaux-{projectId}`
- Edits et rendez-vous existants dans le navigateur utilisateur via `localStorage` :
  - `apcc-prospect-edits:{id}`
  - `apcc-appointments`

Avant migration serveur, il faudra prevoir une strategie d'import de ces donnees locales si elles ont ete utilisees en production.

## Variables d'environnement

`.env.example` declare :

- `NEXT_PUBLIC_APP_URL`
- `APP_ENV`
- `AUTH_SECRET`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_DEFAULT_GID`
- `GMAIL_SYNC_ENABLED`
- `GOOGLE_CALENDAR_SYNC_ENABLED`
- `STORAGE_PROVIDER`
- `LOCAL_UPLOAD_DIR`

Variables Vercel constatees via `vercel env ls` :

- `GMAIL_FROM_EMAIL` : Production
- `GOOGLE_CLIENT_ID` : Production
- `GOOGLE_CLIENT_SECRET` : Production
- `GOOGLE_REFRESH_TOKEN` : Production

Variables manquantes ou a ajouter pour la suite :

- `DATABASE_URL` : obligatoire pour activer Prisma en production.
- `AUTH_SECRET` : obligatoire pour une auth serveur.
- `STORAGE_PROVIDER` : devrait devenir `vercel_blob`, `supabase`, ou `s3`.
- `BLOB_READ_WRITE_TOKEN` si Vercel Blob est retenu.
- ou variables Supabase/S3 si ce stockage est retenu.
- `GOOGLE_REDIRECT_URI` production si OAuth complet est expose.
- variables de signature electronique futures si prestataire retenu.

## Configuration Vercel

Projet lie :

- `projectName`: `apcc-pilot`
- `projectId`: `prj_iUN5wtmTg8eaSehxaEIzY5mp9qZ4`
- `orgId`: `team_s40ast9phoE2oQAo2oEAvqjo`

Observation critique : aucune `DATABASE_URL` n'est presente dans les variables Vercel listees. Cela confirme que la production actuelle fonctionne sans persistance PostgreSQL applicative pour les donnees CRM.

## Stockage de fichiers actuel

Il n'y a pas de stockage fichiers reel dans l'application.

- Aucun upload document en UI.
- Aucun endpoint upload.
- Aucun Vercel Blob/Supabase/S3 configure.
- Schema Prisma `Document` stocke seulement un `path`, insuffisant et dangereux pour une GED.
- `.env.example` propose `STORAGE_PROVIDER=local`, incompatible avec une GED durable sur Vercel.

Conclusion : Phase 1 doit commencer par un stockage prive controle, idealement Vercel Blob prive si l'objectif est de rester dans l'ecosysteme Vercel.

## Securite et permissions

Points faibles :

- Pas d'auth serveur active.
- Pas de middleware de protection des routes.
- Pas de verification de permission cote serveur.
- Routes API POST accessibles sans session.
- Page login non connectee.
- Donnees prospect accessibles sans authentification applicative.
- Gmail send endpoint protege uniquement par la presence des secrets serveur, pas par une permission utilisateur.
- Aucun audit log operationnel depuis les actions UI.

Risque : avant GED, documents clients et donnees financieres, il faut imperativement mettre en place auth, sessions et droits serveur.

## Risques de regression

- Les IDs actuels bases sur lignes Google Sheets peuvent changer si des lignes sont inserees/supprimees dans le Sheet.
- Les edits `localStorage` sont lies aux IDs actuels ; une modification de mapping peut perdre les edits locaux.
- Brancher Prisma sans plan de migration peut creer des doublons entre Google Sheets, ClubTravaux et futurs prospects crees manuellement.
- Changer la source de verite trop brutalement casserait liste prospects, pipeline et fiches.
- Le stockage local navigateur ne survivra pas au changement d'appareil.
- `next lint` est obsolete et interactif, donc non compatible CI.
- Le schema Prisma et `migration.sql` ne couvrent pas exactement les nouveaux besoins documentaires.

## Resultats des commandes

- `npm run lint` : echec. `next lint` est deprecie et lance une configuration interactive ESLint.
- `npm run test` : OK.
- `npm run typecheck` : OK.
- `npm run build` : OK.

Details :

- Build Next.js production reussi.
- Les pages prospects, pipeline, dashboard et API prospects sont dynamiques.
- Aucun deploiement n'a ete effectue pendant cet audit.

## Problemes detectes

1. Source de verite non persistante pour le CRM.
2. Prisma present mais non utilise par les ecrans.
3. Absence de `DATABASE_URL` en production.
4. Authentification absente.
5. Permissions absentes.
6. GED absente.
7. Stockage local declare mais non adapte.
8. Routes API majoritairement en simulation.
9. Lint non fonctionnel en mode CI.
10. Donnees ClubTravaux codees en dur.
11. Google Sheets fetch en direct sans table d'import, historique ni dedup serveur durable.
12. Gmail OAuth variables presentes, mais pas encore de suivi email complet, brouillons, threads ou pieces jointes.

## Plan recommande

### Pre-phase technique obligatoire

1. Corriger lint CI avec une config ESLint explicite.
2. Ajouter PostgreSQL production (`DATABASE_URL`) via Vercel Storage/Neon/Supabase.
3. Brancher Prisma Client dans une couche serveur unique.
4. Creer une migration additive, sans modifier `0001_initial`.
5. Mettre une auth serveur minimale avant documents.
6. Importer les leads actuels vers la base en conservant leurs external IDs.

### Phase 1 recommandee

1. Creer un dossier metier unifie.
2. Ajouter GED privee avec stockage controle.
3. Ajouter arborescences documentaires.
4. Ajouter journal d'activite.
5. Ajouter upload/preview/download securises.
6. Migrer les fiches prospects vers la base sans casser Google Sheets.

## Migrations necessaires pour la phase 1

Nouvelle migration additive proposee, par exemple `0002_business_file_documents` :

- ajouter `BusinessFile`
- ajouter `ExternalLead`
- etendre `Prospect` avec `businessLine`, `externalSource`, `externalId`, `worksiteAddress`, `administrativeStatus`, `worksiteStatus`, `signedAmount`, `potentialAmount`
- ajouter `DocumentFolderTemplate`
- ajouter `DocumentFolderTemplateItem`
- ajouter `DocumentFolder`
- remplacer ou etendre `Document` avec metadonnees completes
- ajouter `DocumentVersion`
- ajouter `DocumentTag`
- ajouter `DocumentShareLink`
- ajouter `DocumentRequest`
- ajouter `DocumentRequestItem`
- ajouter `DocumentAccessLog`
- ajouter `ActivityLog` ou reutiliser/renforcer `AuditLog`

Cette migration doit etre strictement additive pour ne pas casser la production.

## Schema de donnees propose pour la phase 1

### BusinessFile

- `id`
- `kind` : PROSPECT, CLIENT, PROJECT, WORKSITE, CONDOMINIUM
- `displayName`
- `prospectId`
- `clientId`
- `projectId`
- `worksiteId`
- `primaryContactName`
- `companyName`
- `phone`
- `email`
- `worksiteAddress`
- `businessLine`
- `commercialStatus`
- `administrativeStatus`
- `worksiteStatus`
- `potentialAmount`
- `signedAmount`
- `nextAction`
- `alerts`
- `createdAt`
- `updatedAt`
- `archivedAt`

### ExternalLead

- `id`
- `source`
- `externalId`
- `businessLine`
- `rawPayload`
- `prospectId`
- `firstSeenAt`
- `lastSeenAt`
- unique `(source, externalId)`

### DocumentFolderTemplate

- `id`
- `name`
- `projectType`
- `businessLine`
- `active`
- `createdAt`
- `updatedAt`

### DocumentFolderTemplateItem

- `id`
- `templateId`
- `parentId`
- `name`
- `position`
- `required`
- `expectedCategory`
- `active`

### DocumentFolder

- `id`
- `businessFileId`
- `parentId`
- `templateItemId`
- `name`
- `position`
- `required`
- `createdAt`
- `archivedAt`

### Document

- `id`
- `businessFileId`
- `folderId`
- `prospectId`
- `clientId`
- `projectId`
- `worksiteId`
- `originalName`
- `displayName`
- `mimeType`
- `size`
- `storageProvider`
- `storageKey`
- `storageUrl`
- `category`
- `status`
- `currentVersion`
- `documentDate`
- `expiresAt`
- `uploadedById`
- `visibility`
- `notes`
- `metadata`
- `createdAt`
- `updatedAt`
- `archivedAt`

### DocumentVersion

- `id`
- `documentId`
- `version`
- `storageKey`
- `size`
- `mimeType`
- `uploadedById`
- `createdAt`
- `notes`

### DocumentShareLink

- `id`
- `documentId`
- `businessFileId`
- `tokenHash`
- `expiresAt`
- `revokedAt`
- `createdById`
- `createdAt`
- `maxDownloads`
- `downloadCount`

### DocumentRequest / DocumentRequestItem

- demande groupee de pieces manquantes ;
- jeton de depot client ;
- expiration ;
- statut par piece attendue ;
- lien vers `Document` apres depot.

### DocumentAccessLog

- `id`
- `documentId`
- `actorId`
- `action`
- `ip`
- `userAgent`
- `createdAt`

## Acces ou cles a fournir

Pour demarrer la phase 1 :

- Base PostgreSQL production ou choix Vercel Postgres/Neon/Supabase.
- Confirmation du stockage prive retenu : Vercel Blob prive recommande si Vercel reste la plateforme principale.
- Secret auth production `AUTH_SECRET`.
- Decision sur l'auth : compte unique Thomas au debut, puis roles plus tard.
- Confirmation si les edits `localStorage` actuels doivent etre migres.
- Liste des utilisateurs initiaux si plusieurs roles doivent exister des maintenant.

