"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "@/lib/types";

const APPOINTMENTS_KEY = "apcc-appointments";

export function AppointmentsWorkspace({ initialAppointments }: Readonly<{ initialAppointments: Appointment[] }>) {
  const [items, setItems] = useState(initialAppointments);

  useEffect(() => {
    const stored = window.localStorage.getItem(APPOINTMENTS_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  if (items.length === 0) {
    return (
      <section className="empty-state">
        <h2>Aucun rendez-vous planifie</h2>
        <p>Des qu'une fiche prospect passe en rendez-vous planifie avec une date, elle apparaitra ici automatiquement.</p>
        <a className="button" href="/prospects">Qualifier les prospects</a>
      </section>
    );
  }

  return (
    <section className="grid cols-3">
      {items
        .slice()
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((appointment) => (
          <article className="panel appointment-card" key={appointment.id}>
            <span className="badge blue">{appointment.template}</span>
            <h2>{appointment.title}</h2>
            <p>{new Date(appointment.startsAt).toLocaleString("fr-FR")}</p>
            <p className="muted">{appointment.address || "Adresse a confirmer"}</p>
            <p className="muted">{appointment.owner}</p>
          </article>
        ))}
    </section>
  );
}
