"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function NewAppointmentPage() {
  const [message, setMessage] = useState("");

  async function createAppointment(formData: FormData) {
    const response = await fetch("/api/appointments", {
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
          <h1>Creer un rendez-vous</h1>
          <p>Preparation Google Calendar avec modele, adresse chantier et rappels.</p>
        </div>
      </div>
      {message ? <p className="toast">{message}</p> : null}
      <form action={createAppointment} className="panel">
        <div className="form-grid">
          <div className="field"><label>Titre</label><input name="title" required /></div>
          <div className="field"><label>Modele</label><select name="template"><option>Etude pompe a chaleur</option><option>Etude climatisation</option><option>Visite technique</option><option>Rendez-vous commercial</option><option>Reception de chantier</option><option>Intervention SAV</option></select></div>
          <div className="field"><label>Date et heure</label><input name="startsAt" type="datetime-local" required /></div>
          <div className="field"><label>Commercial</label><input name="owner" defaultValue="Camille Martin" required /></div>
          <div className="field"><label>Adresse chantier</label><input name="address" required /></div>
          <div className="field"><label>E-mail invite</label><input name="guestEmail" type="email" /></div>
        </div>
        <button className="button" type="submit" style={{ marginTop: 14 }}>Preparer le rendez-vous</button>
      </form>
    </AppShell>
  );
}
