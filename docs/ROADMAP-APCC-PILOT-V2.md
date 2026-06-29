# Roadmap APCC Pilot V2

Objectif : transformer APCC Pilot en systeme metier complet sans recreer l'application, sans casser les routes existantes et sans supprimer les donnees actuelles.

## Principes de migration

1. Ne jamais modifier une migration deja executee.
2. Creer uniquement des migrations additives.
3. Preserver les routes existantes.
4. Garder Google Sheets et ClubTravaux comme sources d'import pendant la transition.
5. Introduire PostgreSQL comme source de verite progressivement.
6. Garder le mode brouillon par defaut pour Gmail.
7. Ne pas stocker de secret dans le code.
8. Ne pas ajouter de bouton factice : chaque action visible doit avoir un effet clair ou etre marquee simulation.
9. Tester lint/typecheck/test/build avant livraison.
10. Pas de deploiement sans validation.

## Phase 0 - Stabilisation technique

Fichiers probables :

- `package.json`
- config ESLint a creer
- `lib/db.ts`
- `prisma/schema.prisma`
- nouvelle migration Prisma
- scripts d'import initial

Objectifs :

- corriger `npm run lint` pour un lint non interactif ;
- ajouter une base PostgreSQL production ;
- creer Prisma Client singleton ;
- ajouter un premier seed/import serveur ;
- proteger les routes sensibles par une auth minimale ;
- documenter les variables d'environnement.

Risques :

- duplication de leads si l'import n'a pas de cle externe stable ;
- perte des edits locaux si non migres ;
- changement de source de verite trop brutal.

Validation :

- lint OK ;
- tests OK ;
- typecheck OK ;
- build OK ;
- import idempotent des leads.

## Phase 1 - GED et dossier unifie

Fichiers/modules probables :

- `prisma/schema.prisma`
- migration `0002_business_file_documents`
- `app/files/[id]/page.tsx` ou `app/dossiers/[id]/page.tsx`
- `components/BusinessFileHeader.tsx`
- `components/BusinessFileTabs.tsx`
- `components/DocumentsWorkspace.tsx`
- `app/api/documents/*`
- `lib/storage/*`
- `lib/permissions/*`

Migrations :

- `BusinessFile`
- `ExternalLead`
- `DocumentFolderTemplate`
- `DocumentFolderTemplateItem`
- `DocumentFolder`
- `Document`
- `DocumentVersion`
- `DocumentTag`
- `DocumentShareLink`
- `DocumentRequest`
- `DocumentRequestItem`
- `DocumentAccessLog`
- renforcement `AuditLog`

Fonctions livrables :

- page dossier unifie avec onglets ;
- en-tete dossier ;
- arborescence documentaire ;
- upload multi-fichiers ;
- stockage prive ;
- preview PDF/image ;
- download securise ;
- journal d'activite ;
- modeles d'arborescences initiaux PAC, Climatisation, Renovation, Copropriete.

Risques :

- securite fichiers ;
- permissions serveur ;
- URLs publiques permanentes interdites ;
- volume de stockage ;
- migration des documents futurs.

Decision stockage recommandee :

- Vercel Blob prive si l'equipe veut rester sur Vercel.
- Supabase Storage si la base est Supabase.
- S3 compatible si besoin d'une politique plus industrielle.

## Phase 2 - Administratif et aides

Migrations :

- `AdministrativeCase`
- `AdministrativeChecklistTemplate`
- `AdministrativeChecklistItem`
- `AdministrativeDocumentRequirement`
- `GrantApplication` a relier et etendre
- `GrantStatusHistory`
- `HouseholdMember`
- `MissingDocumentRequest`

Livrables :

- checklist par type de dossier ;
- pieces nominatives par membre du foyer ;
- statut des pieces ;
- taux de completude ;
- bouton "Demander les pieces manquantes" en mode brouillon ;
- lien depot client securise.

Risques :

- ne pas generer de faux formulaires officiels ;
- distinction stricte notes internes / portail client ;
- relances uniquement sur pieces manquantes.

## Phase 3 - Gmail et relances

Migrations :

- `EmailTemplate`
- `EmailSequence`
- `EmailSequenceStep`
- `EmailSequenceEnrollment`
- `EmailEvent`
- `EmailAttachment`
- `EmailSyncState`

Livrables :

- mode brouillon par defaut ;
- creation de brouillons Gmail ;
- envoi manuel valide ;
- stockage des emails dans le dossier ;
- pieces jointes depuis documents ;
- sequences devis/documents/signature/acompte ;
- arret automatique sur reponse, signature, RDV, dossier perdu.

Risques :

- delivrabilite Gmail ;
- doublons de relance ;
- consentement/opposition ;
- quota Gmail.

## Phase 4 - Devis et facturation

Migrations :

- `Quote` a etendre ;
- `QuoteVersion` a etendre ;
- `QuoteLine`
- `QuoteDocument`
- `QuoteEvent`
- `QuoteSignature`
- `Invoice` a etendre ;
- `InvoiceLine`
- `PaymentSchedule`
- `CreditNote`
- `PaymentReminder`

Livrables :

- plusieurs propositions par projet ;
- statut devis ;
- PDF associe ;
- suivi envoi/vue/signature ;
- acompte ;
- factures et paiements ;
- alertes solde/retard.

Risques :

- numerotation facture irreversible ;
- ne pas faire une comptabilite complete ;
- futures integrations comptables.

## Phase 5 - Chantiers

Migrations :

- extension `Worksite`
- extension `WorksitePhase`
- `WorksiteTask`
- `WorksitePlanningItem`
- `WorksiteTeam`
- `WorksiteVehicle`
- extension photos et reserves

Livrables :

- creation chantier apres signature ;
- phases chantier ;
- planning semaine/mois ;
- photos mobile par categorie ;
- compte rendu ;
- reception/reserves ;
- SAV.

Risques :

- UX mobile chantier ;
- droits sous-traitants ;
- stockage photos ;
- hors connexion a differer.

## Phase 6 - Coproprietes B2B

Migrations :

- `Company`
- `ProfessionalContact`
- `PropertyManager`
- `Condominium`
- `Building`
- `BuildingEntrance`
- `HeatingPlant`
- `CondominiumOpportunity`
- `CondominiumCampaign`
- `GeneralMeeting`
- `SyndicateCouncil`
- `EnergyStudy`
- `ProspectingAction`

Livrables :

- module B2B separe ;
- pipeline coproprietes ;
- syndics et contacts ;
- batiments/chaufferies ;
- campagnes ;
- statistiques B2B ;
- cartographie si bibliotheque retenue.

Risques :

- modelisation relationnelle plus complexe ;
- RGPD/prospection ;
- qualite et source des donnees ;
- historique des changements.

## Ordre conseille des prochains commits

1. Corriger lint et ajouter config ESLint.
2. Ajouter `DATABASE_URL` production et Prisma Client.
3. Creer migration Phase 1 additive.
4. Importer les leads actuels en table persistante.
5. Ajouter auth minimale.
6. Creer `BusinessFile` et page dossier en lecture seule.
7. Ajouter stockage prive et upload GED.
8. Ajouter templates d'arborescences.
9. Ajouter journal d'activite.

## Definition of Done Phase 1

- Les leads existants sont preserves.
- Les fiches prospects existantes restent accessibles.
- Chaque prospect peut ouvrir un dossier unifie.
- Les documents sont stockes en prive.
- Les fichiers sont references en base.
- Les uploads/downloads sont controles cote serveur.
- Les actions documentaires sont journalisees.
- Les permissions serveur existent au minimum pour Thomas.
- `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` passent.

