# Configuration Clay pour APCC CoproScan

## Mode webhook (obligatoire)

### 1. Créer les tables Clay

Dans votre espace Clay, créez deux tables :

**Table 1 : APCC Syndic Accounts**
- Colonnes attendues : `syndic_id`, `siren`, `name`, `website`, `address`, `city`
- Enrichissements : société, domaine, téléphone

**Table 2 : APCC Syndic People**
- Colonnes attendues : `syndic_id`, `first_name`, `last_name`, `role`, `email`, `phone`, `linkedin_url`, `email_verified`
- Enrichissements : recherche de rôles professionnels, waterfall email/téléphone

### 2. Configurer le webhook d'ingestion

1. Dans Clay, ouvrez la table **APCC Syndic Accounts**.
2. Allez dans **Settings > Webhook Ingest**.
3. Copiez l'URL du webhook.
4. Collez-la dans votre `.env` :
   ```
   CLAY_INGEST_WEBHOOK_URL=https://api.clay.com/v3/sources/webhook/...
   ```

### 3. Configurer le callback vers CoproScan

Dans Clay, configurez un webhook de sortie (output) vers :
```
POST https://votre-domaine.com/api/integrations/clay/callback
```

Headers requis :
```
Authorization: Bearer <valeur_de_CLAY_CALLBACK_SECRET>
```

Payload attendu par CoproScan :
```json
{
  "idempotency_key": "company_syndicId_2026-01-15",
  "status": "done",
  "company": {
    "website": "https://...",
    "phone": "..."
  },
  "people": [
    {
      "first_name": "...",
      "last_name": "...",
      "role": "Gestionnaire copropriété",
      "email": "...",
      "phone": "...",
      "linkedin_url": "...",
      "email_verified": true,
      "source_url": "..."
    }
  ]
}
```

### 4. Variables d'environnement

```env
CLAY_MODE=webhook
CLAY_INGEST_WEBHOOK_URL=https://api.clay.com/v3/sources/webhook/VOTRE_ID
CLAY_CALLBACK_SECRET=votre_secret_fort_aleatoire
CLAY_ENRICHMENT_ENABLED=true
CLAY_MAX_DAILY_JOBS=100
```

### 5. Activer l'enrichissement

Une fois les variables configurées, allez dans **CoproScan > Clay Enrichment Center** et cliquez **Enrichir** sur les syndics souhaités.

---

## Mode Enterprise (optionnel)

Si vous disposez d'un plan Clay Enterprise avec accès API People/Company :

```env
CLAY_ENTERPRISE_API_KEY=votre_cle_api
```

L'adaptateur utilisera automatiquement l'API directe si la clé est présente et le mode est configuré en `enterprise`.

---

## Rôles recherchés (dans l'ordre)

1. Directeur copropriété
2. Responsable copropriété
3. Principal copropriété
4. Gestionnaire copropriété
5. Directeur d'agence
6. Responsable technique
7. Responsable patrimoine / énergie
8. Dirigeant / Gérant (petites structures)

**Exclus** : résidents, présidents de conseil syndical (contacts privés), tout contact personnel.

---

## Import/Export CSV de secours

Si Clay n'est pas encore configuré, vous pouvez :

1. Exporter la liste des syndics depuis `GET /api/coproscan/syndics` (format JSON).
2. Enrichir manuellement dans un tableur.
3. Importer les contacts enrichis via `POST /api/coproscan/contacts` avec `sourceProvider: "manual"`.

---

## Sécurité et RGPD

- Le secret HMAC/Bearer est vérifié à chaque callback (`verifyClayCallback`).
- Un callback sans signature valide retourne 401.
- Une clé idempotente empêche les doublons de jobs.
- Chaque contact créé par Clay est tracé avec `sourceProvider: "clay"` et `sourceDate`.
- Un contact opposé (RGPD) est exclu automatiquement de tous les envois Clay.

---

## Test du webhook

```bash
curl -X POST https://votre-domaine.com/api/integrations/clay/callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer votre_secret" \
  -d '{
    "idempotency_key": "test_key",
    "status": "done",
    "people": []
  }'
```

Réponse attendue : `{"received": true}`

Si vous obtenez 401, vérifiez `CLAY_CALLBACK_SECRET`.
