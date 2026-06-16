# APCC PILOT

CRM commercial et suivi de chantier pour APCC Neuf et Renovation.

## Architecture

- Next.js App Router avec TypeScript.
- UI responsive en CSS natif avec l'identite APCC.
- API routes locales pour prospects, pipeline, taches, import CSV et connecteurs.
- Prisma schema pret pour PostgreSQL.
- Lecture live du Google Sheet APCC sans secrets externes.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Ouvrir `http://localhost:3000`.

## Comptes de test UI

- `admin@apcc.fr` / role Administrateur
- `direction@apcc.fr` / role Direction
- `commercial@apcc.fr` / role Commercial
- `travaux@apcc.fr` / role Conducteur de travaux

L'authentification reelle sera branchee avec sessions serveur, hachage de mots de passe et controle de permissions cote serveur.

## Connexion Google

1. Creer un projet Google Cloud.
2. Activer Google Sheets API, Gmail API et Google Calendar API.
3. Creer un OAuth Client Web.
4. Renseigner `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI`.
5. Ajouter les scopes selon le connecteur:
   - Sheets: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Gmail: `https://www.googleapis.com/auth/gmail.modify`
   - Calendar: `https://www.googleapis.com/auth/calendar.events`

Sans identifiants, les connecteurs restent en mode simulation avec historique d'import.

## Google Sheets

Le fichier de depart est prepare via:

```text
GOOGLE_SHEETS_SPREADSHEET_ID=1dFXhXlD3g7NU8H7HjJJ2V3B4n3GrhUFfWoUpYeVWNzA
GOOGLE_SHEETS_DEFAULT_GID=1926972254
```

L'ecran Administration > Connecteurs permet de choisir le fichier, l'onglet, la frequence, la source et le commercial. Le mapping de colonnes est modelise dans `Connector.config`.

## Webhooks

Endpoint prevu:

```text
POST /api/connectors/webhook
```

Payload minimal:

```json
{
  "firstName": "Marie",
  "lastName": "Durand",
  "phone": "0600000000",
  "email": "marie@example.fr",
  "city": "Toulouse",
  "postalCode": "31000",
  "projectTypes": ["Pompe a chaleur air/eau"],
  "source": "Webhook"
}
```

## Fonctionnalites terminees dans cet increment

- Dashboard metier APCC avec indicateurs commerciaux et chantiers.
- Pipeline Kanban alimente par les leads Google Sheet.
- Liste prospects issue du Google Sheet, sans contacts fictifs.
- Import CSV avec parsing local et detection des doublons.
- Administration des connecteurs avec lecture live Google Sheets public CSV.
- Schema Prisma couvrant les entites finales.
- Documentation d'installation et variables d'environnement.

## Elements necessitant des cles externes

- OAuth Google pour Sheets, Gmail et Calendar.
- Stockage cloud des documents.
- API Virtuosa si disponible.
- Signature electronique.
- Service SMTP/Gmail reel pour l'envoi automatique.
