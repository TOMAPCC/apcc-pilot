# Architecture APCC Pilot V2

## Objectif

Faire evoluer APCC Pilot vers un logiciel metier unique, installe comme PWA, centre sur le cycle:

Lead -> Prospect -> Opportunite -> Rendez-vous -> Etude/Devis -> Client -> Administratif -> Chantier -> Facturation -> SAV.

## Principes

- Une seule application Next.js existante.
- PostgreSQL comme source de verite.
- Prisma pour toutes les lectures/ecritures metier.
- Aucune migration deja executee ne doit etre modifiee.
- Les integrations externes passent par adaptateurs serveur.
- Les boutons visibles doivent declencher une action reelle ou afficher clairement une configuration manquante.
- Les actions sensibles sont journalisees.
- Les automatisations commencent en mode validation.

## Couches

### UI

- `app/*`: routes App Router.
- `components/*`: composants client et shell.
- `app/globals.css`: design system actuel.

Evolution Phase 1:
- `AppShell` repliable et responsive.
- topbar permanente.
- palette commandes Ctrl/Cmd+K.
- navigation metier complete.
- PWA manifest.
- files de travail.

### Domaine

Créer une couche domaine dans `lib/domain/*` pour separer:
- pipeline;
- campagnes;
- files de travail;
- communications;
- documents;
- clients;
- chantiers.

### Persistence

Actuel:
- `lib/prospect-repository.ts` concentre deja prospects, clients, rendez-vous et documents.

Evolution:
- scinder en repositories:
  - `prospect-repository`;
  - `client-repository`;
  - `campaign-repository`;
  - `task-repository`;
  - `activity-repository`;
  - `document-repository`.

### Integrations

Créer des adaptateurs:
- `lib/integrations/email/gmail-adapter.ts`;
- `lib/integrations/calendar/google-calendar-adapter.ts`;
- `lib/integrations/phone/phone-provider.ts`;
- `lib/integrations/whatsapp/whatsapp-provider.ts`;
- `lib/integrations/sms/sms-provider.ts`;
- `lib/integrations/storage/document-storage.ts`.

Chaque adaptateur doit exposer:
- `isConfigured()`;
- `send` ou action equivalent;
- mode test;
- erreurs typées;
- journalisation.

## Modele Metier Cible Phase 1

### Campagne

Une campagne filtre par defaut les prospects, activites, appels, messages et stats.

Champs proposes:
- id;
- name;
- status;
- businessLine;
- source;
- startsAt;
- endsAt;
- active;
- ownerId;
- createdAt;
- updatedAt.

### Pipeline

Grandes etapes:
- Nouveau;
- A contacter;
- Contact en cours;
- Rendez-vous;
- Etude ou proposition;
- Negociation;
- Gagne;
- Perdu.

Les details passent en sous-statut.

### Activite

Une table d'evenements doit capter appels, statuts, notes, messages, documents, rendez-vous, actions IA.

### Files de Travail

Les files sont des vues calculees depuis prospects, taches, rendez-vous et activites. Elles ne doivent pas dupliquer la source de verite.

## PWA

Ajouter:
- `public/manifest.webmanifest`;
- icones APCC;
- metadata Next;
- theme color;
- mode standalone;
- page mobile adaptee;
- notification de nouvelle version dans une phase ulterieure.

## Securite

Actuel insuffisant: pas d'auth serveur.

Architecture cible:
- session serveur;
- middleware;
- roles/permissions en base;
- controle d'acces dans les routes API;
- audit log pour actions sensibles;
- protection webhooks par signature.

## Documents

Le stockage actuel en base doit devenir provisoire. La cible est un stockage prive type Vercel Blob ou equivalent avec metadata en PostgreSQL.

Phase 1 peut preparer les tables de metadata sans deplacer encore tous les fichiers.

## Deploiement

- Production: Vercel.
- Base: Neon PostgreSQL.
- Git: GitHub `TOMAPCC/apcc-pilot`.
- Toute phase doit passer par branche, commit, preview, validation, puis production.
