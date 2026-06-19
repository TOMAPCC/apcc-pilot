"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export function SyncSheetsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => {
      startTransition(() => router.refresh());
    }, 120_000);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <button
      className="secondary-button"
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
    >
      {pending ? "Synchronisation..." : "Synchroniser Google Sheets"}
    </button>
  );
}
