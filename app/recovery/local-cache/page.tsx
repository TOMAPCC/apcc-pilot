"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const RECOVERY_TOKEN = "apcc-recovery-20260630";

type RecoveryEdit = {
  id: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  nextAction?: string;
  appointmentStartsAt?: string;
  lossReason?: string;
  lostReason?: string;
};

type RecoveryAppointment = {
  id: string;
  prospectId: string;
  startsAt?: string;
  address?: string;
  template?: string;
};

export default function LocalCacheRecoveryPage() {
  const [preview, setPreview] = useState<{ edits: RecoveryEdit[]; appointments: RecoveryAppointment[] } | null>(null);
  const [result, setResult] = useState<{ restored: number; ignored: number; results: Array<{ id: string; status: string; restored: boolean; message?: string }> } | null>(null);
  const [message, setMessage] = useState("");
  const qualifiedEdits = useMemo(() => preview?.edits.filter((edit) => edit.status && edit.status !== "Nouveau lead") ?? [], [preview]);

  function readLocalCache() {
    const edits = Object.keys(window.localStorage)
      .filter((key) => key.startsWith("apcc-prospect-edits:"))
      .map((key) => safeParse(window.localStorage.getItem(key)))
      .filter((item): item is RecoveryEdit => Boolean(item?.id));
    const appointments = safeParse(window.localStorage.getItem("apcc-appointments")) ?? [];

    setPreview({ edits, appointments });
    setResult(null);
    setMessage(`${edits.length} fiche(s) locale(s), ${appointments.length} rendez-vous local(aux).`);
  }

  async function restore() {
    if (!preview) return;

    setMessage("Restauration en cours...");
    setResult(null);

    const response = await fetch("/api/recovery/local-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: RECOVERY_TOKEN,
        edits: preview.edits,
        appointments: preview.appointments
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "Restauration impossible.");
      return;
    }

    setResult(data);
    setMessage(`${data.restored} fiche(s) restauree(s), ${data.ignored} ignoree(s).`);
  }

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Recovery local CRM</h1>
          <p>Lecture du cache Chrome de ce navigateur puis reinjection des qualifications en base.</p>
        </div>
        <Link className="secondary-button" href="/prospects">Retour prospects</Link>
      </div>

      <section className="panel">
        <div className="section-head">
          <h2>Cache navigateur</h2>
          <button className="button" type="button" onClick={readLocalCache}>Lire le cache local</button>
        </div>
        {message ? <p className="toast">{message}</p> : null}

        {preview ? (
          <>
            <div className="grid cols-3" style={{ marginBottom: 16 }}>
              <div className="metric card"><span>Fiches locales</span><strong>{preview.edits.length}</strong><small>Total detecte</small></div>
              <div className="metric card"><span>Fiches qualifiees</span><strong>{qualifiedEdits.length}</strong><small>Hors nouveau lead</small></div>
              <div className="metric card"><span>Rendez-vous locaux</span><strong>{preview.appointments.length}</strong><small>A reinjecter</small></div>
            </div>
            <button className="button" type="button" onClick={restore} disabled={!qualifiedEdits.length && !preview.appointments.length}>
              Restaurer en base
            </button>
          </>
        ) : null}
      </section>

      {preview ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="section-head">
            <h2>Apercu des qualifications</h2>
            <span className="badge blue">{qualifiedEdits.length}</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Statut</th>
                <th>Action / motif</th>
              </tr>
            </thead>
            <tbody>
              {qualifiedEdits.map((edit) => (
                <tr key={edit.id}>
                  <td>
                    <strong>{edit.firstName} {edit.lastName}</strong>
                    <div className="muted">{edit.id}</div>
                  </td>
                  <td>{edit.status}</td>
                  <td>{edit.lossReason ?? edit.lostReason ?? edit.nextAction ?? edit.appointmentStartsAt ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {result ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="section-head">
            <h2>Resultat</h2>
            <span className="badge blue">{result.restored} restauree(s)</span>
          </div>
          <table className="table">
            <tbody>
              {result.results.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.status}</td>
                  <td>{item.restored ? "OK" : item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </AppShell>
  );
}

function safeParse(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
