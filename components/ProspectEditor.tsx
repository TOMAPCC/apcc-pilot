"use client";

import { useEffect, useMemo, useState } from "react";
import type { Priority, Prospect, ProspectStatus } from "@/lib/types";

const statuses: ProspectStatus[] = [
  "Nouveau lead",
  "A qualifier",
  "A contacter",
  "Contact etabli",
  "Rendez-vous planifie",
  "Devis envoye",
  "Negociation",
  "Dossier signe",
  "Dossier perdu"
];

const priorities: Priority[] = ["Basse", "Normale", "Haute", "Urgente"];

export function ProspectEditor({ prospect }: Readonly<{ prospect: Prospect }>) {
  const storageKey = `apcc-prospect-edits:${prospect.id}`;
  const [draft, setDraft] = useState(prospect);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setDraft({ ...prospect, ...JSON.parse(stored) });
    }
  }, [prospect, storageKey]);

  const completion = useMemo(() => {
    const fields = [draft.phone, draft.email, draft.address, draft.postalCode, draft.city, draft.heatingSystem, draft.comments];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [draft]);

  function update<K extends keyof Prospect>(key: K, value: Prospect[K]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setSaved(true);
  }

  return (
    <div className="detail-layout">
      <section className="identity-panel">
        <div className="identity-gradient">
          <span className="source-pill">{draft.source}</span>
          <h1>{draft.firstName} {draft.lastName}</h1>
          <p>{draft.projectTypes.join(", ")}</p>
          <div className="identity-actions">
            <a className="button" href={`tel:${draft.phone.replace(/\s/g, "")}`}>Appeler</a>
            <a className="secondary-button" href={`mailto:${draft.email}`}>E-mail</a>
          </div>
        </div>
        <div className="health-grid">
          <div><strong>{draft.score}/100</strong><span>Score lead</span></div>
          <div><strong>{completion}%</strong><span>Fiche complete</span></div>
          <div><strong>{draft.department || "--"}</strong><span>Departement</span></div>
        </div>
      </section>

      <section className="editor-panel">
        <div className="section-head">
          <h2>Fiche prospect editable</h2>
          <button className="button" onClick={save}>Enregistrer</button>
        </div>
        {saved ? <p className="toast">Modifications sauvegardees dans ce navigateur. La prochaine etape est la base PostgreSQL pour partager ces edits a toute l'equipe.</p> : null}

        <div className="form-grid">
          <div className="field"><label>Prenom</label><input value={draft.firstName} onChange={(event) => update("firstName", event.target.value)} /></div>
          <div className="field"><label>Nom</label><input value={draft.lastName} onChange={(event) => update("lastName", event.target.value)} /></div>
          <div className="field"><label>Telephone</label><input value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></div>
          <div className="field"><label>E-mail</label><input value={draft.email} onChange={(event) => update("email", event.target.value)} /></div>
          <div className="field"><label>Adresse personnelle</label><input value={draft.address} onChange={(event) => update("address", event.target.value)} placeholder="Adresse a completer" /></div>
          <div className="field"><label>Adresse chantier</label><input value={draft.worksiteAddress} onChange={(event) => update("worksiteAddress", event.target.value)} placeholder="Adresse chantier" /></div>
          <div className="field"><label>Code postal</label><input value={draft.postalCode} onChange={(event) => update("postalCode", event.target.value)} /></div>
          <div className="field"><label>Ville / commune</label><input value={draft.city} onChange={(event) => update("city", event.target.value)} /></div>
          <div className="field"><label>Statut</label><select value={draft.status} onChange={(event) => update("status", event.target.value as ProspectStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Priorite</label><select value={draft.priority} onChange={(event) => update("priority", event.target.value as Priority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Chauffage actuel</label><input value={draft.heatingSystem ?? ""} onChange={(event) => update("heatingSystem", event.target.value)} /></div>
          <div className="field"><label>Prochaine action</label><input value={draft.nextAction} onChange={(event) => update("nextAction", event.target.value)} /></div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Commentaires, questions et contexte</label>
          <textarea value={draft.comments} onChange={(event) => update("comments", event.target.value)} />
        </div>
      </section>

      <section className="timeline-panel">
        <h2>Chronologie</h2>
        <div className="timeline-item"><span />Lead recu depuis {draft.source}</div>
        <div className="timeline-item"><span />Qualification a effectuer</div>
        <div className="timeline-item"><span />Adresse chantier a confirmer</div>
      </section>
    </div>
  );
}
