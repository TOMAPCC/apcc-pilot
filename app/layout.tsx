import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APCC PILOT",
  description: "CRM commercial et suivi de chantier APCC"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
