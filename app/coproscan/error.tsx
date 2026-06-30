"use client";

import Link from "next/link";

export default function CoproScanError({
  error,
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
      {error?.message && (
        <pre style={{ textAlign: "left", background: "#f4f4f2", border: "1px solid #e5e5e3", borderRadius: 8, padding: 14, fontSize: 12, color: "#c82333", maxWidth: 600, margin: "0 auto 20px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {error.message}
        </pre>
      )}
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
