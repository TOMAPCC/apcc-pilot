"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCloserEmail } from "@/lib/closer-email";
import type { Appointment, Priority, Prospect, ProspectStatus } from "@/lib/types";

const statuses: ProspectStatus[] = [
  "Nouveau lead",
  "A qualifier",
  "A contacter",
  "N'a pas repondu",
  "Contact etabli",
  "Rendez-vous planifie",
  "Devis envoye",
  "Negociation",
  "Dossier signe",
  "Dossier perdu"
];

const priorities: Priority[] = ["Basse", "Normale", "Haute", "Urgente"];
const APPOINTMENTS_KEY = "apcc-appointments";

type ProspectDraft = Prospect & {
  appointmentStartsAt?: string;
  appointmentAddress?: string;
  appointmentNotes?: string;
  lossReason?: string;
};

export function ProspectEditor({ prospect }: Readonly<{ prospect: Prospect }>) {
  const storageKey = `apcc-prospect-edits:${prospect.id}`;
  const [draft, setDraft] = useState<ProspectDraft>(prospect);
  const [saved, setSaved] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "sent" | "not-configured" | "error">("idle");

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

  function update<K extends keyof ProspectDraft>(key: K, value: ProspectDraft[K]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    syncAppointment(draft);
    setSaved(true);
  }

  const closerMail = useMemo(() => buildCloserEmail(draft), [draft]);
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(draft.email)}&su=${encodeURIComponent(closerMail.subject)}&body=${encodeURIComponent(closerMail.text)}`;
  const mailtoHref = `mailto:${draft.email}?subject=${encodeURIComponent(closerMail.subject)}&body=${encodeURIComponent(closerMail.text)}`;

  function toggleNoAnswer(checked: boolean) {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      status: checked ? "N'a pas repondu" : current.status === "N'a pas repondu" ? "A contacter" : current.status,
      nextAction: checked ? "Relance email closer envoyee puis rappel sous 24h" : current.nextAction,
      nextFollowUp: checked ? tomorrowIso() : current.nextFollowUp
    }));
  }

  async function copyCloserMail() {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([closerMail.html], { type: "text/html" }),
          "text/plain": new Blob([`${closerMail.subject}\n\n${closerMail.text}`], { type: "text/plain" })
        })
      ]);
    } else {
      await navigator.clipboard.writeText(`${closerMail.subject}\n\n${closerMail.text}`);
    }
    setMailCopied(true);
    window.setTimeout(() => setMailCopied(false), 2400);
  }

  async function sendViaGmail() {
    setSendingMail(true);
    setSendStatus("idle");

    try {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospect: draft })
      });

      if (response.ok) {
        setSendStatus("sent");
        setDraft((current) => ({
          ...current,
          status: "N'a pas repondu",
          nextAction: "Relance Gmail envoyee puis rappel sous 24h",
          nextFollowUp: tomorrowIso()
        }));
        return;
      }

      setSendStatus(response.status === 409 || response.status === 502 ? "not-configured" : "error");
    } catch {
      setSendStatus("error");
    } finally {
      setSendingMail(false);
    }
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
        {saved ? <p className="toast">{buildSaveMessage(draft)}</p> : null}

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

        {draft.status === "Rendez-vous planifie" ? (
          <div className="qualification-panel">
            <span className="eyebrow">Rendez-vous qualifie</span>
            <div className="form-grid">
              <div className="field">
                <label>Date et heure du rendez-vous</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(draft.appointmentStartsAt)}
                  onChange={(event) => update("appointmentStartsAt", event.target.value ? new Date(event.target.value).toISOString() : "")}
                />
              </div>
              <div className="field">
                <label>Adresse du rendez-vous</label>
                <input
                  value={draft.appointmentAddress ?? draft.worksiteAddress ?? draft.address}
                  onChange={(event) => update("appointmentAddress", event.target.value)}
                  placeholder="Adresse client ou chantier"
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Notes rendez-vous</label>
              <textarea
                value={draft.appointmentNotes ?? ""}
                onChange={(event) => update("appointmentNotes", event.target.value)}
                placeholder="Contexte, besoin, infos a valider sur place..."
              />
            </div>
          </div>
        ) : null}

        {draft.status === "Dossier perdu" ? (
          <div className="qualification-panel lost">
            <span className="eyebrow">Motif de perte</span>
            <div className="field">
              <label>Pourquoi ce lead est perdu ?</label>
              <textarea
                value={draft.lossReason ?? ""}
                onChange={(event) => update("lossReason", event.target.value)}
                placeholder="Faux numero, hors zone, pas interesse, non eligible..."
              />
            </div>
          </div>
        ) : null}

        <div className="field" style={{ marginTop: 14 }}>
          <label>Commentaires, questions et contexte</label>
          <textarea value={draft.comments} onChange={(event) => update("comments", event.target.value)} />
        </div>
      </section>

      <section className="closer-panel">
        <div>
          <span className="eyebrow">Relance intelligente</span>
          <h2>Prospect injoignable</h2>
          <p>Quand le lead ne decroche pas, coche ici : le CRM prepare un mail HTML impactant, oriente rappel et rendez-vous.</p>
        </div>

        <label className="switch-row">
          <input
            type="checkbox"
            checked={draft.status === "N'a pas repondu"}
            onChange={(event) => toggleNoAnswer(event.target.checked)}
          />
          <span>Marquer comme n'a pas repondu et preparer la relance</span>
        </label>

        <div className="mail-preview">
          <div className="field">
            <label>Objet</label>
            <input value={closerMail.subject} readOnly />
          </div>
          <div className="field">
            <label>Mail propose</label>
            <div className="rich-mail-preview" dangerouslySetInnerHTML={{ __html: closerMail.html }} />
          </div>
        </div>

        <div className="closer-actions">
          <button className="secondary-button" type="button" onClick={copyCloserMail}>
            {mailCopied ? "Mail formate copie" : "Copier le mail formate"}
          </button>
          <a className="secondary-button" href={mailtoHref}>Ouvrir Mail</a>
          <a className="button" href={gmailHref} target="_blank" rel="noreferrer">Ouvrir dans Gmail</a>
          <button className="button" type="button" onClick={sendViaGmail} disabled={sendingMail || !draft.email}>
            {sendingMail ? "Envoi..." : "Envoyer via Gmail"}
          </button>
        </div>

        {sendStatus === "sent" ? <p className="toast">Relance envoyee depuis Gmail. Statut passe en n'a pas repondu.</p> : null}
        {sendStatus === "not-configured" ? <p className="toast warning">Gmail n'est pas encore connecte cote serveur. Il faut ajouter l'OAuth Google dans Vercel pour activer l'envoi automatique.</p> : null}
        {sendStatus === "error" ? <p className="toast warning">L'envoi Gmail a echoue. Verifie la connexion Gmail ou utilise le bouton Ouvrir dans Gmail.</p> : null}
      </section>

      <section className="timeline-panel">
        <h2>Chronologie</h2>
        <div className="timeline-item"><span />Lead recu depuis {draft.source}</div>
        <div className="timeline-item"><span />Qualification a effectuer</div>
        {draft.status === "N'a pas repondu" ? <div className="timeline-item"><span />Relance email closer a envoyer</div> : null}
        <div className="timeline-item"><span />Adresse chantier a confirmer</div>
      </section>
    </div>
  );
}

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

function syncAppointment(prospect: ProspectDraft) {
  const stored = window.localStorage.getItem(APPOINTMENTS_KEY);
  const appointments = stored ? (JSON.parse(stored) as Appointment[]) : [];
  const id = `appointment-${prospect.id}`;
  const existing = appointments.filter((appointment) => appointment.id !== id);

  if (prospect.status !== "Rendez-vous planifie") {
    window.localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(existing));
    return;
  }

  const startsAt = prospect.appointmentStartsAt || tomorrowAtNine();
  const appointment: Appointment = {
    id,
    title: `${prospect.firstName} ${prospect.lastName} - ${prospect.businessLine === "Prime Adapt" ? "Prime Adapt" : "Pompe a chaleur"}`,
    prospectId: prospect.id,
    owner: "Thomas Cauquil",
    startsAt,
    address: prospect.appointmentAddress || prospect.worksiteAddress || prospect.address || `${prospect.postalCode} ${prospect.city}`,
    template: prospect.businessLine === "Prime Adapt" ? "RDV Prime Adapt" : "RDV pompe a chaleur"
  };

  window.localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([...existing, appointment]));
}

function buildSaveMessage(prospect: ProspectDraft) {
  if (prospect.status === "Rendez-vous planifie") {
    return "Fiche enregistree. Le prospect est passe dans le pipeline Rendez-vous planifie et le rendez-vous est visible dans la page Rendez-vous.";
  }

  if (prospect.status === "Dossier perdu") {
    return "Fiche enregistree. Le prospect est classe en dossier perdu et sort du flux actif.";
  }

  if (prospect.status === "Dossier signe") {
    return "Fiche enregistree. Le prospect est classe en dossier signe dans le pipeline.";
  }

  return "Fiche enregistree. Le pipeline reprend automatiquement ce statut.";
}

function tomorrowAtNine() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

function toDatetimeLocal(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
