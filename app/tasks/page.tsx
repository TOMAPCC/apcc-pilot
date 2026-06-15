import { AppShell } from "@/components/AppShell";
import { tasks } from "@/lib/demo-data";

export default function TasksPage() {
  return (
    <AppShell>
      <div className="page-title">
        <div>
          <h1>Taches et rappels</h1>
          <p>Relances, appels, documents, devis, chantier et SAV.</p>
        </div>
        <a className="button" href="/tasks/new">Ajouter une tache</a>
      </div>
      <section className="panel">
        <table className="table">
          <thead>
            <tr><th>Type</th><th>Titre</th><th>Responsable</th><th>Date</th><th>Priorite</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.type}</td>
                <td>{task.title}</td>
                <td>{task.owner}</td>
                <td>{new Date(task.dueDate).toLocaleDateString("fr-FR")}</td>
                <td><span className="badge hot">{task.priority}</span></td>
                <td>{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
