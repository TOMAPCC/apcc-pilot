import { prisma } from "@/lib/db";
import type { ClaimWithProof } from "./types";

const APCC = {
  companyName: process.env.APCC_COMPANY_NAME ?? "APCC Neuf et Rénovation",
  website: process.env.APCC_WEBSITE ?? "https://www.apccneufetrenovation.com/",
  phone: process.env.APCC_PHONE ?? "06 09 62 08 05",
  email: process.env.APCC_EMAIL ?? "apcc.mg@gmail.com",
  logoUrl: process.env.APCC_LOGO_URL ?? "",
  primaryBlue: process.env.APCC_PRIMARY_BLUE ?? "#263A7A",
  primaryRed: process.env.APCC_PRIMARY_RED ?? "#C82333",
  salesName: process.env.APCC_SALES_NAME ?? "",
  salesTitle: process.env.APCC_SALES_TITLE ?? "",
  bookingUrl: process.env.BOOKING_URL ?? "",
  privacyUrl: process.env.PRIVACY_NOTICE_URL ?? "",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function proposedSlots(): string[] {
  // Propose two business-hour slots in the next 5-10 days
  const now = new Date();
  const slots: string[] = [];
  let day = 1;
  while (slots.length < 2 && day < 15) {
    const d = new Date(now);
    d.setDate(now.getDate() + day);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      d.setHours(slots.length === 0 ? 10 : 14, 30, 0, 0);
      slots.push(formatDate(d) + (slots.length === 0 ? " à 10h30" : " à 14h30"));
    }
    day++;
  }
  return slots;
}

export interface GenerateDraftInput {
  coproprieteId: string;
  contactId: string;
}

export interface GenerateDraftResult {
  draftId: string;
  subject: string;
  subjectVariants: string[];
  bodyHtml: string;
  bodyText: string;
  claims: ClaimWithProof[];
  followUpJ4: string;
  followUpJ9: string;
  followUpJ15: string;
  proposedSlots: string[];
  warnings: string[];
}

export async function generateEmailDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const contact = await prisma.contact.findUnique({
    where: { id: input.contactId },
    include: { syndic: true },
  });
  if (!contact) throw new Error("Contact introuvable");

  const copropriete = await prisma.copropriete.findUnique({
    where: { id: input.coproprieteId },
    include: {
      dpeProofs: { orderBy: { createdAt: "desc" }, take: 5 },
      energyProofs: { orderBy: { createdAt: "desc" }, take: 5 },
      syndic: true,
    },
  });
  if (!copropriete) throw new Error("Copropriété introuvable");

  const warnings: string[] = [];

  // Guard: only send to approved contact statuses
  if (!["verified", "public_professional"].includes(contact.contactStatus)) {
    throw new Error(
      `Contact non approuvé pour envoi (statut: ${contact.contactStatus}). Validation humaine requise.`
    );
  }

  // Guard: check opposition
  if (contact.gdprOpposedAt || copropriete.gdprOpposedAt) {
    throw new Error("Opposition RGPD active — génération d'email impossible.");
  }

  // Guard: classification must be confirmed EFG
  if (copropriete.classificationStatus !== "confirmed") {
    throw new Error(
      `Copropriété non confirmée EFG (statut: ${copropriete.classificationStatus}). Validation requise.`
    );
  }

  // Build claims with proofs
  const claims: ClaimWithProof[] = [];

  const energyClass = copropriete.energyClass ?? "E";
  const bestDpe = copropriete.dpeProofs[0];
  if (bestDpe) {
    claims.push({
      claim: `La copropriété est classée ${energyClass} selon un DPE ${bestDpe.isCollective ? "collectif" : "bâtiment"} (${bestDpe.ademeRef ?? "référence ADEME"})`,
      source: "ADEME",
      reference: bestDpe.ademeRef ?? undefined,
      date: bestDpe.sourceDate ? formatDate(bestDpe.sourceDate) : undefined,
      url: bestDpe.sourceUrl ?? undefined,
    });
  } else {
    claims.push({
      claim: `La copropriété est classée ${energyClass} au registre national des copropriétés`,
      source: "RNIC",
      reference: copropriete.rnicId ?? undefined,
      url: "https://www.registre-coproprietes.gouv.fr/",
    });
    warnings.push("Aucun DPE ADEME direct — affirmation basée sur RNIC uniquement.");
  }

  if (copropriete.lotsResidential) {
    claims.push({
      claim: `Elle comprend ${copropriete.lotsResidential} lot(s) à usage d'habitation`,
      source: "RNIC",
      reference: copropriete.rnicId ?? undefined,
    });
  }

  const syndicName = contact.syndic.name;
  const contactSalutation = contact.firstName ? `${contact.firstName}` : "Madame, Monsieur";
  const slots = APCC.bookingUrl ? [] : proposedSlots();
  const bookingCta = APCC.bookingUrl
    ? `<a href="${APCC.bookingUrl}" style="color:${APCC.primaryBlue}">Réserver un créneau de 15 minutes</a>`
    : `Je vous propose les créneaux suivants : ${slots.join(" ou ")}.`;

  const bookingCtaText = APCC.bookingUrl
    ? `Réservez un créneau de 15 minutes : ${APCC.bookingUrl}`
    : `Je vous propose les créneaux suivants : ${slots.join(" ou ")}.`;

  const subjectVariants = [
    `${copropriete.city} – Diagnostic énergétique gratuit pour votre copropriété (DPE ${energyClass})`,
    `Votre portefeuille copropriétés : diagnostic d'opportunité CEE sans engagement`,
    `${syndicName} – Identifier les aides mobilisables sur votre parc énergivore`,
  ];

  const subject = subjectVariants[0];

  const signature = APCC.salesName
    ? `${APCC.salesName}${APCC.salesTitle ? ` — ${APCC.salesTitle}` : ""}<br>${APCC.companyName}`
    : APCC.companyName;

  const claimsList = claims
    .map(
      (c) =>
        `<li>${c.claim}${c.source ? ` <span style="font-size:11px;color:#666">[${c.source}${c.reference ? ` – ${c.reference}` : ""}]</span>` : ""}</li>`
    )
    .join("\n");

  const bodyHtml = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td>
<table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;margin:20px auto;border-radius:6px;overflow:hidden">
  <tr>
    <td style="background:${APCC.primaryBlue};padding:20px 30px">
      ${APCC.logoUrl ? `<img src="${APCC.logoUrl}" alt="${APCC.companyName}" height="48" style="display:block">` : `<span style="color:#fff;font-size:20px;font-weight:bold">${APCC.companyName}</span>`}
    </td>
  </tr>
  <tr>
    <td style="padding:30px">
      <p>Bonjour ${contactSalutation},</p>
      <p>Je me permets de vous contacter au sujet du patrimoine copropriété géré par <strong>${syndicName}</strong>, notamment concernant la copropriété <strong>${copropriete.name}</strong> à <strong>${copropriete.city}</strong>.</p>
      <p>Nos données issues du registre national des copropriétés et des diagnostics de performance énergétique indiquent que ce bâtiment présente un classement énergie <strong>${energyClass}</strong>, ce qui le place parmi les immeubles pour lesquels des dispositifs d'aide à la rénovation — notamment les Certificats d'Économies d'Énergie (CEE) — pourraient être mobilisables.</p>
      <p><strong>APCC Neuf et Rénovation</strong>, RGE QUALIPAC, vous propose <strong>sans engagement</strong> un premier diagnostic d'opportunité afin de :</p>
      <ul>
        <li>Confirmer la situation énergétique réelle du bâtiment ;</li>
        <li>Identifier les solutions techniquement envisageables (pompe à chaleur collective, isolation, etc.) ;</li>
        <li>Vérifier les dispositifs CEE potentiellement mobilisables.</li>
      </ul>
      <p style="background:#fff8e1;border-left:4px solid ${APCC.primaryRed};padding:12px;font-size:13px">L'éligibilité aux aides, le montant des subventions et l'éventuel reste à charge ne peuvent être confirmés qu'après analyse technique et administrative complète.</p>
      <p>Voici les éléments factuels sur lesquels repose cette démarche :</p>
      <ul>${claimsList}</ul>
      <p>Seriez-vous disponible pour un échange de 15 minutes afin que nous puissions vous présenter notre approche ? ${bookingCta}</p>
      <p>Bien cordialement,</p>
      <p>${signature}<br>
      <a href="tel:${APCC.phone.replace(/\s/g, "")}" style="color:${APCC.primaryBlue}">${APCC.phone}</a> ·
      <a href="mailto:${APCC.email}" style="color:${APCC.primaryBlue}">${APCC.email}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="font-size:11px;color:#888">Ce message est adressé à titre professionnel, dans le cadre de la prospection B2B. Vous pouvez vous désinscrire à tout moment en répondant STOP à cet email ou en nous contactant à <a href="mailto:${APCC.email}" style="color:#888">${APCC.email}</a>.${APCC.privacyUrl ? ` <a href="${APCC.privacyUrl}" style="color:#888">Politique de confidentialité</a>.` : ""}</p>
    </td>
  </tr>
  <tr>
    <td style="background:${APCC.primaryBlue};padding:15px 30px;text-align:center">
      <a href="${APCC.website}" style="color:#fff;font-size:12px">${APCC.website}</a>
    </td>
  </tr>
</table>
</td></tr></table>
</body>
</html>`;

  const bodyText = `Bonjour ${contactSalutation},

Je me permets de vous contacter au sujet du patrimoine copropriété géré par ${syndicName}, notamment la copropriété ${copropriete.name} à ${copropriete.city}.

Nos données indiquent un classement énergie ${energyClass}. APCC Neuf et Rénovation (RGE QUALIPAC) vous propose sans engagement un diagnostic d'opportunité pour confirmer la situation énergétique du bâtiment, identifier les solutions envisageables et vérifier les dispositifs CEE potentiellement mobilisables.

L'éligibilité, le montant des aides et l'éventuel reste à charge ne seront confirmés qu'après analyse technique et administrative complète.

${bookingCtaText}

Bien cordialement,
${APCC.salesName || APCC.companyName}
${APCC.phone} · ${APCC.email}
${APCC.website}

---
Message professionnel B2B. Pour vous désinscrire : répondez STOP ou écrivez à ${APCC.email}.`;

  const followUpJ4 = `Bonjour ${contactSalutation}, je me permets de revenir vers vous suite à mon message du ${formatDate(new Date())} concernant ${copropriete.name}. Avez-vous eu l'occasion de le lire ? Je reste disponible pour un échange de 15 minutes. ${bookingCtaText}`;

  const followUpJ9 = `Bonjour ${contactSalutation}, je reviens une dernière fois au sujet du diagnostic d'opportunité gratuit pour ${copropriete.name}. Si ce n'est pas le bon moment ou si vous n'êtes pas la bonne personne, n'hésitez pas à me l'indiquer. ${bookingCtaText}`;

  const followUpJ15 = `Bonjour ${contactSalutation}, je clôture mon suivi sur ${copropriete.name}. Si votre situation évolue ou si vous souhaitez nous contacter ultérieurement, nous restons disponibles : ${APCC.phone} · ${APCC.email}`;

  const oppositionCheckedAt = new Date();

  const draft = await prisma.emailDraft.create({
    data: {
      coproprieteId: input.coproprieteId,
      contactId: input.contactId,
      syndicId: contact.syndicId,
      subject,
      bodyHtml,
      bodyText,
      subjectVariants,
      claims: claims as object[],
      draftStatus: "generated",
      followUpJ4,
      followUpJ9,
      followUpJ15,
      proposedSlots: slots,
      bookingUrl: APCC.bookingUrl || null,
      oppositionCheckedAt,
      isDemo: false,
    },
  });

  return {
    draftId: draft.id,
    subject,
    subjectVariants,
    bodyHtml,
    bodyText,
    claims,
    followUpJ4,
    followUpJ9,
    followUpJ15,
    proposedSlots: slots,
    warnings,
  };
}
