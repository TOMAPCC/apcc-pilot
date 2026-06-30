"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Une erreur est survenue</h2>
      <p style={{ color: "#888", marginBottom: 20 }}>
        Le serveur n&apos;a pas pu charger cette page. Vérifiez la connexion à la base de données.
      </p>
      <button onClick={reset} style={{ padding: "8px 20px", cursor: "pointer" }}>
        Réessayer
      </button>
    </div>
  );
}
