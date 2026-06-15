import { AppShell } from "@/components/AppShell";
import { appointments } from "@/lib/demo-data";

export default function AppointmentsPage() {
  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Rendez-vous</h1>
          <p>Modeles Google Calendar prets pour confirmation et rappels automatiques.</p>
        </div>
        <a className="button" href="/appointments/new">Creer un rendez-vous</a>
      </div>
      <section className="grid cols-3">
        {appointments.map((appointment) => (
          <article className="panel" key={appointment.id}>
            <span className="badge blue">{appointment.template}</span>
            <h2>{appointment.title}</h2>
            <p>{new Date(appointment.startsAt).toLocaleString("fr-FR")}</p>
            <p className="muted">{appointment.address}</p>
            <p className="muted">{appointment.owner}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
