import { AppShell } from "@/components/AppShell";
import { AppointmentsWorkspace } from "@/components/AppointmentsWorkspace";
import { appointments } from "@/lib/demo-data";
import { getPersistentAppointments, isDatabaseConfigured } from "@/lib/prospect-repository";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppointmentsPage() {
  const initialAppointments = isDatabaseConfigured() ? await getPersistentAppointments() : appointments;

  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Rendez-vous</h1>
          <p>Modeles Google Calendar prets pour confirmation et rappels automatiques.</p>
        </div>
        <Link className="button" href="/appointments/new">Creer un rendez-vous</Link>
      </div>
      <AppointmentsWorkspace initialAppointments={initialAppointments} />
    </AppShell>
  );
}
