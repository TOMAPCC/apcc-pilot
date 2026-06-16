import { AppShell } from "@/components/AppShell";
import { AppointmentsWorkspace } from "@/components/AppointmentsWorkspace";
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
      <AppointmentsWorkspace initialAppointments={appointments} />
    </AppShell>
  );
}
