"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function NewProspectPage() {
  const [message, setMessage] = useState("");

  async function createProspect(formData: FormData) {
    setMessage("Verification anti-doublon en cours...");
    const response = await fetch("/api/prospects", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "content-type": "application/json" }
    });
    const result = await response.json();
    setMessage(result.message);
  }

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Nouveau prospect</h1>
          <p>Creation avec verification anti-doublon sur telephone, e-mail, nom/code postal et adresse chantier.</p>
        </div>
      </div>
      {message ? <p className="toast">{message}</p> : null}
      <form action={createProspect} className="panel">
        <div className="form-grid">
          <div className="field"><label>Nom</label><input name="lastName" required /></div>
          <div className="field"><label>Prenom</label><input name="firstName" required /></div>
          <div className="field"><label>Telephone</label><input name="phone" required /></div>
          <div className="field"><label>E-mail</label><input name="email" type="email" required /></div>
          <div className="field"><label>Adresse chantier</label><input name="worksiteAddress" required /></div>
          <div className="field"><label>Code postal</label><input name="postalCode" required /></div>
          <div className="field"><label>Ville</label><input name="city" required /></div>
          <div className="field"><label>Projet</label><input name="projectTypes" placeholder="Pompe a chaleur air/eau; Climatisation" /></div>
          <div className="field"><label>Source</label><select name="source"><option>Google Sheets</option><option>clubtravaux.app</option><option>Site web</option><option>Import CSV</option></select></div>
          <div className="field"><label>Budget estime</label><input name="estimatedBudget" type="number" min="0" defaultValue="0" /></div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Commentaires internes</label>
          <textarea name="comments" />
        </div>
        <button className="button" type="submit" style={{ marginTop: 14 }}>Enregistrer</button>
      </form>
    </AppShell>
  );
}
