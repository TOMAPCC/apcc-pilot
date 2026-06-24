import type { Prospect } from "./types";

type ClubTravauxLead = {
  projectId: number;
  trade: string;
  date: string;
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  mobile: string;
  landline: string;
  email: string;
  comments: string;
  bloctel: string;
  questions: string;
  status: string;
  assignedTo: string;
};

const clubTravauxLeads: ClubTravauxLead[] = [
  {
    projectId: 2062650,
    trade: "Pompe a chaleur AIR/EAU",
    date: "24/06/2026",
    firstName: "Samba ilunga",
    lastName: "BULAYA",
    address: "N.C",
    postalCode: "34000",
    city: "Montpellier",
    mobile: "0760802586",
    landline: "+33760802586",
    email: "jisbulaya@hotmail.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Indiquez la surface a chauffer : entre 100 et 200m2, Quel est votre objectif ? : comparer les modeles, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2062534,
    trade: "Pompe a chaleur AIR/EAU",
    date: "24/06/2026",
    firstName: "Mireille",
    lastName: "ALUAGA",
    address: "N.C",
    postalCode: "84800",
    city: "Lagnes",
    mobile: "0778108056",
    landline: "+33778108056",
    email: "aliaga.mireille84@gmail.com",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : fioul, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : autre, Surface a chauffer : entre 100 et 200m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2061999,
    trade: "Pompe a chaleur AIR/EAU",
    date: "23/06/2026",
    firstName: "Arlette",
    lastName: "STEPHANIE",
    address: "N.C",
    postalCode: "11000",
    city: "Carcassonne",
    mobile: "0663687459",
    landline: "+33663687453",
    email: "sbaldass31140@gmail.com",
    comments: "N.C",
    bloctel: "Liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : - 100m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2061548,
    trade: "Pompe a chaleur AIR/EAU",
    date: "23/06/2026",
    firstName: "Pierre",
    lastName: "BARRABES",
    address: "N.C",
    postalCode: "11300",
    city: "@town",
    mobile: "0683280466",
    landline: "+33683280466",
    email: "pierre.barrabes@hotmail.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2060566,
    trade: "Pompe a chaleur AIR/EAU",
    date: "22/06/2026",
    firstName: "Manon",
    lastName: "BROSSARD",
    address: "N.C",
    postalCode: "30520",
    city: "Saint-Martin-de-Valgalgues",
    mobile: "0698424138",
    landline: "+33698424138",
    email: "barre.manon@outlook.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Indiquez la surface a chauffer : - de 100m2, Quel est votre objectif ? : information sur les aides, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2058544,
    trade: "Pompe a chaleur AIR/EAU",
    date: "20/06/2026",
    firstName: "Michel",
    lastName: "TALDIR",
    address: "N.C",
    postalCode: "34200",
    city: "@town",
    mobile: "0603605248",
    landline: "+33603605248",
    email: "taldirmichel@gmail.com",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2057492,
    trade: "Pompe a chaleur AIR/EAU",
    date: "19/06/2026",
    firstName: "Paquerette",
    lastName: "GIARDINI",
    address: "N.C",
    postalCode: "84390",
    city: "Monieux",
    mobile: "0676719739",
    landline: "+33676719739",
    email: "paquerettegiardini1@gmail.com",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : - 100m2, Avez vous un jardin ? : non, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2056466,
    trade: "Pompe a chaleur AIR/EAU",
    date: "17/06/2026",
    firstName: "Bruno",
    lastName: "MIGRENNE",
    address: "N.C",
    postalCode: "30380",
    city: "Saint-Christol-lez-Ales",
    mobile: "0621229524",
    landline: "+33621229524",
    email: "migrennebruno@gmail.com",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : - 100m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2055519,
    trade: "Pompe a chaleur AIR/EAU",
    date: "16/06/2026",
    firstName: "Pascal",
    lastName: "LE SERGENT",
    address: "nc",
    postalCode: "34300",
    city: "Agde",
    mobile: "0674466318",
    landline: "0674466318",
    email: "pascallesergent@orange.fr",
    comments: "- type de bien : maison\n- statut occupant : acquereur\n- surface : 200 m2\n- annee de construction : 2011_2022\n- chauffage actuel : electrique\n- eau chaude sanitaire : cumulus\n- facture elec : 1300\n- facture bois : 600\n- personnes au foyer : 4\n- revenu fiscal : tres_modeste\n- statut emploi : auto_entrepreneur\n- urgence : dans_6_mois\n- etat projet : renseignement_droits",
    bloctel: "Non liste",
    questions: "Delai de realisation : de 3 a 6 mois, Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : entretien / reparation / maintenance, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2055230,
    trade: "Pompe a chaleur AIR/EAU",
    date: "16/06/2026",
    firstName: "ROGER",
    lastName: "VALVERDE",
    address: "N.C",
    postalCode: "84500",
    city: "Bollene",
    mobile: "0612184015",
    landline: "+33612184015",
    email: "valverde.roger@orange.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : entre 100 et 200m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2054592,
    trade: "Pompe a chaleur AIR/EAU",
    date: "15/06/2026",
    firstName: "Elisabeth",
    lastName: "CHATELAS",
    address: "N.C",
    postalCode: "34660",
    city: "Cournonsec",
    mobile: "661725988",
    landline: "33661725988",
    email: "elisabethchatelas6@gmail.com",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : entre 100 et 200m2, Avez vous un jardin ? : non, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2052887,
    trade: "Pompe a chaleur AIR/EAU",
    date: "13/06/2026",
    firstName: "Fred",
    lastName: "TEISSIER",
    address: "route d'ales",
    postalCode: "30900",
    city: "Nimes",
    mobile: "685934865",
    landline: "33685934865",
    email: "scitusconseil@wanadoo.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : remplacement, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2052271,
    trade: "Pompe a chaleur AIR/EAU",
    date: "13/06/2026",
    firstName: "Jean-Pierre",
    lastName: "DECHELLE",
    address: "N.C",
    postalCode: "30560",
    city: "Saint-Hilaire-de-Brethmas",
    mobile: "608012311",
    landline: "33608012311",
    email: "miroiterie-dechelle@hotmail.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : - 100m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2051862,
    trade: "Pompe a chaleur AIR/EAU",
    date: "12/06/2026",
    firstName: "Stephanie",
    lastName: "JOURNET",
    address: "N.C",
    postalCode: "84130",
    city: "Le Pontet",
    mobile: "626860126",
    landline: "33626860126",
    email: "stef-tortue@hotmail.fr",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : entre 100 et 200m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2050447,
    trade: "Pompe a chaleur AIR/EAU",
    date: "11/06/2026",
    firstName: "Veronique",
    lastName: "DORP",
    address: "N.C",
    postalCode: "30700",
    city: "Uzes",
    mobile: "615122503",
    landline: "33615122503",
    email: "veroniquedorp66@gmail.com",
    comments: "N.C",
    bloctel: "Non liste",
    questions: "Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : installation neuve, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2050046,
    trade: "Pompe a chaleur AIR/EAU",
    date: "10/06/2026",
    firstName: "Brahim",
    lastName: "ZOUGGARI",
    address: "N.C",
    postalCode: "34000",
    city: "Montpellier",
    mobile: "760630402",
    landline: "33760630402",
    email: "zouggari.brahim@gmail.com",
    comments: "N.C",
    bloctel: "Liste",
    questions: "Type de bien : maison, Chauffage actuel : fioul, Situation : proprietaire, Quel est votre projet : installation neuve, Quel type d'emetteurs avez-vous ? : radiateur, Surface a chauffer : entre 100 et 200m2, Avez vous un jardin ? : oui, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  },
  {
    projectId: 2043437,
    trade: "Pompe a chaleur AIR/EAU",
    date: "03/06/2026",
    firstName: "Bernard",
    lastName: "RINGENBACH",
    address: "N.C",
    postalCode: "84300",
    city: "Cavaillon",
    mobile: "952209217",
    landline: "952209217",
    email: "ringenbachbernard56@gmail.com",
    comments: "Type de bien : maison, statut occupant : proprietaire occupant, surface : 250 m2, annee de construction : 1974-1982, chauffage actuel : gaz, eau chaude sanitaire : cumulus, facture elec : 1800, facture gaz : 3000, personnes au foyer : 2, revenu fiscal : intermediaire, statut emploi : retraite, urgence : pas de delai, etat projet : renseignement droits, autres : pompe a chaleur air/eau remplacement gaz/fioul",
    bloctel: "Non liste",
    questions: "Delai de realisation : de 6 a 12 mois, Type de bien : maison, Chauffage actuel : gaz de ville, Situation : proprietaire, Quel est votre projet : entretien / reparation / maintenance, Quel est l'age de votre logement ? : plus de 2 ans",
    status: "Nouveau",
    assignedTo: "THOMAS CAUQUILL"
  }
];

export function getClubTravauxProspects(): Prospect[] {
  return clubTravauxLeads.map((lead) => ({
    id: `clubtravaux-${lead.projectId}`,
    civility: "M.",
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: formatFrenchPhone(lead.mobile || lead.landline),
    secondaryPhone: lead.landline ? formatFrenchPhone(lead.landline) : undefined,
    email: lead.email,
    address: cleanUnknown(lead.address),
    worksiteAddress: cleanUnknown(lead.address),
    postalCode: lead.postalCode.padStart(5, "0"),
    city: cleanCity(lead.city, lead.postalCode),
    department: lead.postalCode.padStart(5, "0").slice(0, 2),
    source: "ClubTravaux",
    businessLine: "Pompe a chaleur",
    assignedTo: normalizeAssignedTo(lead.assignedTo),
    status: "Nouveau lead",
    priority: lead.bloctel.toLowerCase().includes("liste") ? "Basse" : "Haute",
    score: inferScore(lead),
    estimatedBudget: 0,
    nextAction: lead.bloctel.toLowerCase().includes("liste") ? "Verifier Bloctel avant contact" : "Qualifier le lead ClubTravaux",
    nextFollowUp: parseFrenchDate(lead.date),
    projectTypes: [lead.trade],
    housingType: extractAnswer(lead.questions, "Type de bien") || "Maison",
    heatingSystem: extractAnswer(lead.questions, "Chauffage actuel"),
    createdAt: parseFrenchDate(lead.date),
    updatedAt: parseFrenchDate(lead.date),
    comments: [lead.comments, lead.questions, `Projet ClubTravaux n° ${lead.projectId}`].filter((item) => item && item !== "N.C").join("\n")
  }));
}

function inferScore(lead: ClubTravauxLead) {
  const text = `${lead.questions} ${lead.comments}`.toLowerCase();
  let score = 60;

  if (text.includes("proprietaire")) score += 10;
  if (text.includes("gaz") || text.includes("fioul")) score += 10;
  if (text.includes("installation neuve") || text.includes("remplacement")) score += 10;
  if (lead.bloctel.toLowerCase().includes("liste")) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function extractAnswer(source: string, label: string) {
  const match = source.match(new RegExp(`${label}\\\\s*:\\\\s*([^,]+)`, "i"));
  return match?.[1]?.trim();
}

function parseFrenchDate(value: string) {
  const [day, month, year] = value.split("/");
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
}

function formatFrenchPhone(value: string) {
  const clean = value.replace(/\D/g, "");
  const local = clean.startsWith("33") && clean.length === 11 ? `0${clean.slice(2)}` : clean.length === 9 ? `0${clean}` : clean;

  if (local.length === 10) {
    return `${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }

  return value;
}

function cleanUnknown(value: string) {
  return value.toLowerCase() === "n.c" || value.toLowerCase() === "nc" ? "" : value;
}

function cleanCity(value: string, postalCode: string) {
  const clean = value.trim().toLowerCase();
  return clean === "@town" || clean === "n.c" || clean === "nc" ? `CP ${postalCode}` : value;
}

function normalizeAssignedTo(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
