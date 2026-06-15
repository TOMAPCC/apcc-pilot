"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { connectors } from "@/lib/demo-data";
import type { ImportedLead } from "@/lib/sheets-import";

type SyncResult = {
  message: string;
  latest?: ImportedLead[];
  totalRows?: number;
  duplicates?: number;
};

export default function ConnectorsPage() {
  const [message, setMessage] = useState("");
  const [latestLeads, setLatestLeads] = useState<ImportedLead[]>([]);
  const [summary, setSummary] = useState<SyncResult | null>(null);

  async function syncSheets() {
    setMessage("Synchronisation en cours...");
    const response = await fetch("/api/connectors/sheets/sync", { method: "POST" });
    const result = await response.json();
    setMessage(result.message);
    setSummary(result);
    setLatestLeads(result.latest ?? []);
  }

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Connecteurs de leads</h1>
          <p>Google Sheets, clubtravaux.app, CSV, API, webhook et e-mail.</p>
        </div>
        <button className="button" onClick={syncSheets}>Synchroniser Sheets</button>
      </div>
      {message ? <p className="toast">{message}</p> : null}
      <section className="panel">
        <table className="table">
          <thead>
            <tr><th>Nom</th><th>Type</th><th>Statut</th><th>Derniere synchro</th><th>Imports</th><th>Erreurs</th></tr>
          </thead>
          <tbody>
            {connectors.map((connector) => (
              <tr key={connector.id}>
                <td>{connector.name}</td>
                <td>{connector.type}</td>
                <td><span className="badge blue">{connector.status}</span></td>
                <td>{connector.lastSync ? new Date(connector.lastSync).toLocaleString("fr-FR") : "Jamais"}</td>
                <td>{connector.importedCount}</td>
                <td>{connector.errors.length ? connector.errors.join(" ") : "Aucune"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head"><h2>Mapping Google Sheets</h2></div>
        <div className="form-grid">
          <div className="field"><label>Spreadsheet ID</label><input defaultValue="1dFXhXlD3g7NU8H7HjJJ2V3B4n3GrhUFfWoUpYeVWNzA" /></div>
          <div className="field"><label>Onglet / gid</label><input defaultValue="1926972254" /></div>
          <div className="field"><label>Commercial attribue</label><input defaultValue="Camille Martin" /></div>
          <div className="field"><label>Frequence</label><select defaultValue="hourly"><option value="manual">Manuelle</option><option value="hourly">Toutes les heures</option><option value="daily">Chaque jour</option></select></div>
        </div>
      </section>

      {latestLeads.length ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="section-head">
            <h2>Derniers leads Google Sheets</h2>
            <span className="badge blue">
              {summary?.totalRows ?? latestLeads.length} lignes - {summary?.duplicates ?? 0} doublon(s)
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Lead</th>
                <th>Contact</th>
                <th>Projet</th>
                <th>Logement</th>
                <th>Commentaire</th>
                <th>Controle</th>
              </tr>
            </thead>
            <tbody>
              {latestLeads.map((lead) => (
                <tr key={`${lead.rowNumber}-${lead.email}-${lead.phone}`}>
                  <td>{formatDate(lead.entryDate)}</td>
                  <td>
                    <strong>{lead.firstName} {lead.lastName}</strong>
                    <div className="muted">Ligne {lead.rowNumber} - {lead.postalCode}</div>
                  </td>
                  <td>
                    <div>{lead.phone || "Telephone manquant"}</div>
                    <div className="muted">{lead.email || "E-mail manquant"}</div>
                  </td>
                  <td>{lead.project || "Pompe a chaleur"}</td>
                  <td>
                    <div>{lead.housing || "Non renseigne"}</div>
                    <div className="muted">{lead.situation} - {lead.heating}</div>
                  </td>
                  <td>{lead.comment || "Aucun commentaire"}</td>
                  <td>{lead.duplicateId ? <span className="badge hot">Doublon possible</span> : <span className="badge blue">Nouveau</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </AppShell>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || "Sans date" : date.toLocaleDateString("fr-FR");
}
