# Variables d'Environnement APCC Pilot

## Variables Existantes

### Application

- `NEXT_PUBLIC_APP_URL`: URL publique de l'application.
- `APP_ENV`: environnement applicatif.
- `AUTH_SECRET`: secret futur pour sessions/authentification.

### Base de Donnees

- `DATABASE_URL`: URL PostgreSQL Prisma. Presente sur Vercel via Neon.
- `DATABASE_URL_UNPOOLED`: URL Neon non poolée, utile pour certaines operations.
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `NEON_PROJECT_ID`

Ces variables sont injectees par l'integration Neon Vercel. Ne jamais les commiter.

### Google / Gmail

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GMAIL_FROM_EMAIL`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_SYNC_ENABLED`
- `GOOGLE_CALENDAR_SYNC_ENABLED`

Etat actuel:
- l'envoi Gmail est code cote serveur;
- la recuperation des reponses Gmail et les brouillons threads ne sont pas encore industrialises;
- Google Calendar ne cree pas encore d'evenement effectif.

### Google Sheets

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_DEFAULT_GID`

Le code actuel utilise surtout des URLs CSV publiques fixes.

### Stockage

- `STORAGE_PROVIDER`
- `LOCAL_UPLOAD_DIR`

Etat actuel:
- les documents sont stockes en base sous Data URL;
- cible Phase 4: stockage prive dedie.

## Variables a Ajouter Phase 1

### PWA

Aucune variable obligatoire.

### Campagne active

Pas de secret requis. La campagne active sera stockee en base et/ou preference utilisateur.

## Variables a Prevoir Phases Suivantes

### WhatsApp

- `WHATSAPP_PROVIDER`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_WEBHOOK_SECRET`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`

### SMS

- `SMS_PROVIDER`
- `SMS_API_KEY`
- `SMS_SENDER`
- `SMS_WEBHOOK_SECRET`

### Telephonie

- `PHONE_PROVIDER`
- `PHONE_API_KEY`
- `PHONE_WEBHOOK_SECRET`

### Stockage prive

- `BLOB_READ_WRITE_TOKEN` ou equivalent provider.
- `DOCUMENT_SIGNING_SECRET`

### IA

- `OPENAI_API_KEY` ou fournisseur retenu.
- `AI_ACTION_CONFIRMATION_REQUIRED=true` par defaut.

## Regles

- Aucun secret dans le code.
- Aucun secret dans les docs avec valeur reelle.
- `.env*` est ignore par git.
- Toute integration doit afficher une erreur claire si non configuree.
