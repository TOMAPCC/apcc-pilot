import type { Prospect } from "./types";

export type CloserEmailInput = Pick<
  Prospect,
  "firstName" | "email" | "postalCode" | "city" | "projectTypes" | "heatingSystem" | "phone" | "address" | "worksiteAddress"
> & { businessLine?: Prospect["businessLine"] };

export function buildCloserEmail(prospect: CloserEmailInput) {
  if (prospect.businessLine === "Prime Adapt") {
    return buildPrimeAdaptEmail(prospect);
  }

  const firstName = prospect.firstName || "Bonjour";
  const sector = prospect.postalCode ? `le secteur de ${prospect.postalCode}` : prospect.city || "votre secteur";
  const project = prospect.projectTypes[0] || "l'installation d'une pompe à chaleur";
  const heating = prospect.heatingSystem || "gaz, fioul, électrique ou autre";
  const subject = `${firstName}, suite à votre demande de pompe à chaleur`;

  const text = `Bonjour,

Je me permets de revenir vers vous à la suite de votre demande concernant ${project} sur ${sector}.

Nous avons essayé de vous joindre, car votre projet semble présenter des éléments intéressants, notamment dans le cadre du remplacement d'une chaudière gaz ou fioul et de la mobilisation des aides financières disponibles.

L'objectif de notre échange

Un premier appel de quelques minutes nous permettra simplement de :
- confirmer votre système de chauffage actuel ;
- vérifier la faisabilité technique du projet ;
- faire un premier point sur votre éligibilité aux aides ;
- convenir, si votre situation le permet, d'un rendez-vous personnalisé avec APCC.

Ce premier échange est entièrement gratuit et sans engagement.

L'objectif n'est pas de vous proposer une solution standard, mais de vérifier si votre logement peut bénéficier d'un projet réellement intéressant, avec une installation adaptée et un reste à charge clairement défini après déduction des aides.

Pourquoi faire le point rapidement ?

Les conditions d'éligibilité, les montants d'aides et les délais d'instruction peuvent évoluer.

Il serait donc dommage de laisser votre demande sans réponse alors qu'une solution avantageuse est peut-être accessible pour votre logement.

Comment avancer ?

Vous pouvez simplement me rappeler directement aujourd'hui afin que nous fixions ensemble un rendez-vous, ou répondre à ce mail en m'indiquant :
- le meilleur numéro pour vous joindre ;
- le créneau horaire qui vous convient ;
- votre chauffage actuel : ${heating} ;
- l'adresse exacte du logement concerné ;
- si votre projet est toujours d'actualité.

Même si votre projet est encore en réflexion, ce premier échange vous permettra d'obtenir une vision plus claire de sa faisabilité et des possibilités de financement.

Quel serait le meilleur moment pour vous joindre : plutôt en journée ou en fin d'après-midi ?

Au plaisir d'échanger avec vous prochainement.

Bien cordialement,

Thomas - APCC
Neuf et rénovation`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #172033; line-height: 1.58; font-size: 15px;">
      <p>Bonjour,</p>

      <p>
        Je me permets de revenir vers vous à la suite de votre demande concernant
        <strong>l'installation d'une pompe à chaleur sur ${escapeHtml(sector)}</strong>. 🏡
      </p>

      <p>
        📞 <strong>Nous avons essayé de vous joindre</strong>, car votre projet semble présenter des éléments intéressants,
        notamment dans le cadre du remplacement d'une <strong>chaudière gaz ou fioul</strong> et de la mobilisation des
        <strong>aides financières disponibles</strong>.
      </p>

      <h3 style="color: #005997; font-size: 18px; margin: 22px 0 8px;">🔍 L'objectif de notre échange</h3>
      <p>Un premier appel de quelques minutes nous permettra simplement de :</p>

      <p style="margin-left: 8px;">
        ✅ confirmer votre système de chauffage actuel ;<br>
        ✅ vérifier la faisabilité technique du projet ;<br>
        ✅ faire un premier point sur votre éligibilité aux aides ;<br>
        ✅ convenir, si votre situation le permet, d'un <strong>rendez-vous personnalisé avec APCC</strong>.
      </p>

      <p><em>Ce premier échange est entièrement gratuit et sans engagement.</em></p>

      <p>
        L'objectif n'est pas de vous proposer une solution standard, mais de vérifier si votre logement peut bénéficier
        d'un projet réellement intéressant, avec une installation adaptée et un
        <strong>reste à charge clairement défini après déduction des aides</strong>.
      </p>

      <h3 style="color: #8a1429; font-size: 18px; margin: 22px 0 8px;">⚠️ Pourquoi faire le point rapidement ?</h3>
      <p>Les conditions d'éligibilité, les montants d'aides et les délais d'instruction peuvent évoluer.</p>
      <p>
        Il serait donc dommage de laisser votre demande sans réponse alors qu'une
        <strong>solution avantageuse est peut-être accessible pour votre logement</strong>.
      </p>

      <h3 style="color: #005997; font-size: 18px; margin: 22px 0 8px;">📅 Comment avancer ?</h3>
      <p>Vous pouvez simplement :</p>
      <p>👉 <strong>me rappeler directement aujourd'hui</strong> afin que nous fixions ensemble un rendez-vous ;</p>
      <p>ou répondre à ce mail en m'indiquant :</p>

      <p style="margin-left: 8px;">
        📞 le meilleur numéro pour vous joindre ;<br>
        🕐 le créneau horaire qui vous convient ;<br>
        🔥 votre chauffage actuel : ${escapeHtml(heating)} ;<br>
        📍 l'adresse exacte du logement concerné ;<br>
        ✅ si votre projet est toujours d'actualité.
      </p>

      <p>
        Même si votre projet est encore en réflexion, ce premier échange vous permettra d'obtenir une vision plus claire
        de sa faisabilité et des possibilités de financement.
      </p>

      <p><strong>Quel serait le meilleur moment pour vous joindre : plutôt en journée ou en fin d'après-midi ?</strong></p>

      <p>Au plaisir d'échanger avec vous prochainement.</p>
      <p>Bien cordialement,</p>
      <p><strong>Thomas - APCC</strong><br>Neuf et rénovation</p>
    </div>
  `;

  return { subject, text, html };
}

function buildPrimeAdaptEmail(prospect: CloserEmailInput) {
  const firstName = prospect.firstName || "Bonjour";
  const sector = prospect.postalCode ? `le secteur de ${prospect.postalCode}` : prospect.city || "votre secteur";
  const subject = `${firstName}, suite à votre demande Prime Adapt'`;
  const text = `Bonjour,

Je me permets de revenir vers vous à la suite de votre demande concernant l'adaptation de votre salle de bain sur ${sector}.

Nous avons essayé de vous joindre, car votre projet peut potentiellement entrer dans le cadre de MaPrimeAdapt' et des aides mobilisables pour sécuriser votre logement.

L'objectif de notre échange

Un premier appel de quelques minutes nous permettra simplement de :
- confirmer votre situation et le logement concerné ;
- vérifier les premiers critères d'éligibilité ;
- comprendre l'aménagement nécessaire dans votre salle de bain ;
- convenir, si votre situation le permet, d'un rendez-vous personnalisé avec APCC.

Ce premier échange est entièrement gratuit et sans engagement.

Pourquoi faire le point rapidement ?

Les conditions d'éligibilité, les plafonds de revenus et les délais d'instruction peuvent évoluer.

Il serait dommage de laisser votre demande sans réponse alors qu'une solution utile et financée en partie peut peut-être être mise en place pour votre logement.

Comment avancer ?

Vous pouvez me rappeler directement aujourd'hui, ou répondre à ce mail en m'indiquant :
- le meilleur numéro pour vous joindre ;
- le créneau horaire qui vous convient ;
- l'adresse exacte du logement concerné ;
- votre besoin principal : douche sécurisée, accès PMR, remplacement baignoire, barres d'appui ou autre ;
- si votre projet est toujours d'actualité.

Quel serait le meilleur moment pour vous joindre : plutôt en journée ou en fin d'après-midi ?

Bien cordialement,

Thomas - APCC
Neuf et rénovation`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #172033; line-height: 1.58; font-size: 15px;">
      <p>Bonjour,</p>
      <p>
        Je me permets de revenir vers vous à la suite de votre demande concernant
        <strong>l'adaptation de votre salle de bain sur ${escapeHtml(sector)}</strong>. 🛁
      </p>
      <p>
        📞 <strong>Nous avons essayé de vous joindre</strong>, car votre projet peut potentiellement entrer dans le cadre de
        <strong>MaPrimeAdapt'</strong> et des aides mobilisables pour sécuriser votre logement.
      </p>
      <h3 style="color: #005997; font-size: 18px; margin: 22px 0 8px;">🔍 L'objectif de notre échange</h3>
      <p>Un premier appel de quelques minutes nous permettra simplement de :</p>
      <p style="margin-left: 8px;">
        ✅ confirmer votre situation et le logement concerné ;<br>
        ✅ vérifier les premiers critères d'éligibilité ;<br>
        ✅ comprendre l'aménagement nécessaire dans votre salle de bain ;<br>
        ✅ convenir, si votre situation le permet, d'un <strong>rendez-vous personnalisé avec APCC</strong>.
      </p>
      <p><em>Ce premier échange est entièrement gratuit et sans engagement.</em></p>
      <h3 style="color: #8a1429; font-size: 18px; margin: 22px 0 8px;">⚠️ Pourquoi faire le point rapidement ?</h3>
      <p>Les conditions d'éligibilité, les plafonds de revenus et les délais d'instruction peuvent évoluer.</p>
      <p>
        Il serait dommage de laisser votre demande sans réponse alors qu'une
        <strong>solution utile et financée en partie peut peut-être être mise en place pour votre logement</strong>.
      </p>
      <h3 style="color: #005997; font-size: 18px; margin: 22px 0 8px;">📅 Comment avancer ?</h3>
      <p>Vous pouvez me rappeler directement aujourd'hui, ou répondre à ce mail en m'indiquant :</p>
      <p style="margin-left: 8px;">
        📞 le meilleur numéro pour vous joindre ;<br>
        🕐 le créneau horaire qui vous convient ;<br>
        📍 l'adresse exacte du logement concerné ;<br>
        🛁 votre besoin principal : douche sécurisée, accès PMR, remplacement baignoire, barres d'appui ou autre ;<br>
        ✅ si votre projet est toujours d'actualité.
      </p>
      <p><strong>Quel serait le meilleur moment pour vous joindre : plutôt en journée ou en fin d'après-midi ?</strong></p>
      <p>Bien cordialement,</p>
      <p><strong>Thomas - APCC</strong><br>Neuf et rénovation</p>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
