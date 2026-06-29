# Audit APCC Pilot

Date: 2026-06-29  
Branche: `codex/phase-1-socle-ux`  
Application production: `https://apcc-pilot.vercel.app`

## Synthese

APCC Pilot est une application Next.js existante, deployee sur Vercel et reliee a une base PostgreSQL Neon via Prisma. Le coeur prospect/client commence a etre persistant, mais l'application reste encore hybride: certaines actions ecrivent en base, d'autres ne font que valider un payload ou utiliser des donnees de demonstration/localStorage.

Le CRM ne doit plus evoluer par ajouts de pages isolees. La prochaine phase doit installer un socle applicatif clair: navigation metier, campagne active, pipeline simplifie, files de travail, PWA et premieres migrations compatibles avec les donnees actuelles.

## Stack Technique

- Framework: Next.js App Router 15.
- UI: React 19, CSS global maison dans `app/globals.css`.
- Langage: TypeScript.
- Base: PostgreSQL via Prisma.
- Hebergement: Vercel.
- Base cloud: Neon provisionnee par Vercel Marketplace.
- Tests: smoke test Node dans `scripts/smoke-test.mjs`.
- Lint: ESLint flat config.
- Pas de librairie UI, pas de charts, pas de PWA, pas de service worker.

## Routes Existantes

- `/`: tableau de bord commercial.
- `/prospects`: liste prospects avec recherche et filtres persistants.
- `/prospects/[id]`: fiche prospect editable, validation client, relance Gmail, documents client verrouilles avant validation.
- `/prospects/new`: creation manuelle de prospect.
- `/clients`: portefeuille client cree apres validation d'un prospect signe.
- `/pipeline`: kanban commercial.
- `/appointments`: rendez-vous.
- `/appointments/new`: creation de rendez-vous en mode simulation/validation.
- `/tasks`: taches.
- `/tasks/new`: creation de tache en mode simulation/validation.
- `/worksites`: chantiers depuis donnees demo.
- `/admin/connectors`: synchronisation Google Sheets.
- `/login`: page statique sans authentification serveur.

## Fonctionnalites Connectees a la Base

- Lecture prospects via PostgreSQL quand `DATABASE_URL` existe.
- Synchronisation Google Sheets + ClubTravaux vers PostgreSQL.
- Creation manuelle de prospect en PostgreSQL.
- Mise a jour fiche prospect en PostgreSQL.
- Creation automatique d'un rendez-vous quand le statut passe a `Rendez-vous planifie`.
- Creation/actualisation d'un client quand le statut passe a `Dossier signe`.
- Lecture clients depuis PostgreSQL.
- Depot de documents rattaches au client valide.
- Envoi Gmail via OAuth lorsque les variables Gmail sont presentes.

## Fonctionnalites Simulees ou Incompletes

- Authentification: `/login` statique, pas de session, pas de middleware, pas de controle serveur.
- Roles/permissions: models Prisma presents, aucune enforcement applicative.
- Pipeline: changement d'etape local dans l'interface, pas encore persiste depuis le kanban.
- Taches: API valide seulement, pas d'ecriture en base.
- Rendez-vous manuels: API valide seulement, Google Calendar non cree.
- Webhook leads: validation et doublon demo, pas d'ecriture en base.
- Import CSV: analyse preview, pas d'import persistant.
- Chantiers: page sur donnees demo.
- Facturation, devis, aides, SAV, rapports, automatisations, IA: schemas partiels ou absents cote UI fonctionnelle.
- Documents: stockage actuel en base sous Data URL, limite provisoire; pas de stockage prive Blob, arborescence, versions, permissions ni liens securises.
- PWA: non present.
- WhatsApp/SMS/appels: non presents.
- Campagnes: non presentes comme entite fonctionnelle.

## Base de Donnees

Prisma contient deja de nombreux modeles: User, Role, Permission, Prospect, Client, Address, Property, Project, Opportunity, PipelineStage, Appointment, Task, Note, EmailThread, EmailMessage, EmailTemplate, Automation, Quote, Worksite, Invoice, Payment, Document, AuditLog, Connector, ImportHistory, SavRequest.

La migration `0001_initial` a ete executee en production. Elle ne doit pas etre modifiee. Toute evolution Phase 1 doit passer par une nouvelle migration.

## Integrations

- Google Sheets: lecture publique CSV des onglets PAC et Prime Adapt.
- ClubTravaux: donnees statiques integrees dans le code depuis exports precedents.
- Gmail: endpoint `/api/gmail/send` avec refresh token OAuth.
- Google Calendar: non connecte en creation effective.
- Vercel/Neon: connectes.
- GitHub: remote `TOMAPCC/apcc-pilot`, branche `main` poussee.

## Tableau de Bord Actuel

Le tableau de bord affiche des compteurs simples et listes courtes. Il utilise les prospects reels mais certains textes indiquent encore une dependance Google Sheets alors que PostgreSQL est maintenant actif. Les indicateurs ne sont pas tous cliquables et il n'existe pas de periode, campagne active, filtres globaux ou graphiques interactifs.

## Pipeline Actuel

Le pipeline reprend les statuts historiques: `Nouveau lead`, `A qualifier`, `A contacter`, `N'a pas repondu`, `Contact etabli`, `Rendez-vous planifie`, `Devis envoye`, `Negociation`, `Dossier signe`, `Dossier perdu`.

Problemes:
- pas encore simplifie en 8 grandes etapes;
- pas de sous-statuts;
- modifications dans le kanban non persistantes;
- pas de workflow perdu avec motif obligatoire;
- pas d'arret automatique des relances;
- pas de vues par campagne.

## Version Mobile

Le CSS contient des adaptations responsive, mais l'application n'a pas encore de navigation mobile metier, barre d'actions pouce, PWA, manifest, installation standalone, ni workflow mobile pour appel/photo/document/note.

## Risques de Regression

- Ne pas modifier `0001_initial`.
- Ne pas remplacer brutalement les statuts existants sans migration de mapping.
- Ne pas supprimer le fallback Google Sheets tant que les imports automatiques ne sont pas fiabilises.
- Ne pas deplacer les documents existants sans script de migration.
- Ne pas activer d'envoi automatique WhatsApp/SMS/e-mail sans consentement, idempotence et journal.
- Ne pas introduire de boutons non fonctionnels.

## Verifications Executees

- `npm run lint`: OK, 2 warnings `@next/next/no-img-element`.
- `npm run typecheck`: OK.
- `npm run test`: OK.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/apcc npx prisma validate`: OK.
- `npm run build`: OK.

## Conclusion

APCC Pilot a maintenant une base technique exploitable, mais il faut transformer le produit en application metier structuree. La Phase 1 doit prioriser le socle UX, le modele campagne/statuts, les files de travail et la PWA avant les gros modules WhatsApp, devis, documents avances ou IA.
