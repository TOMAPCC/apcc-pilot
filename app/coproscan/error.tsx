"use client";

import Link from "next/link";

export default function CoproScanError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Erreur CoproScan</h2>
      <p style={{ color: "#888", marginBottom: 20 }}>
        Impossible de charger les données (base de données inaccessible ou tables manquantes).
        <br />
        Vérifiez que DATABASE_URL est configuré et que les migrations ont été appliquées.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={reset} style={{ padding: "8px 20px", cursor: "pointer" }}>
          Réessayer
        </button>
        <Link href="/coproscan/imports" style={{ padding: "8px 20px", border: "1px solid #ccc", borderRadius: 4 }}>
          Aller aux imports
        </Link>
      </div>
    </div>
  );
}
