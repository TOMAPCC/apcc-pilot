"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function NewTaskPage() {
  const [message, setMessage] = useState("");

  async function createTask(formData: FormData) {
    const response = await fetch("/api/tasks", {
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
          <h1>Ajouter une tache</h1>
          <p>Appel, relance, devis, document, chantier ou SAV.</p>
        </div>
      </div>
      {message ? <p className="toast">{message}</p> : null}
      <form action={createTask} className="panel">
        <div className="form-grid">
          <div className="field"><label>Type</label><select name="type"><option>Appeler</option><option>Envoyer un e-mail</option><option>Preparer un devis</option><option>Relancer</option><option>Planifier un chantier</option><option>Effectuer un SAV</option></select></div>
          <div className="field"><label>Titre</label><input name="title" required /></div>
          <div className="field"><label>Responsable</label><input name="owner" defaultValue="Camille Martin" required /></div>
          <div className="field"><label>Echeance</label><input name="dueDate" type="date" required /></div>
          <div className="field"><label>Priorite</label><select name="priority"><option>Normale</option><option>Haute</option><option>Urgente</option><option>Basse</option></select></div>
          <div className="field"><label>Statut</label><select name="status"><option>A faire</option><option>En cours</option><option>Terminee</option></select></div>
        </div>
        <div className="field" style={{ marginTop: 14 }}><label>Description</label><textarea name="description" /></div>
        <button className="button" type="submit" style={{ marginTop: 14 }}>Enregistrer la tache</button>
      </form>
    </AppShell>
  );
}
