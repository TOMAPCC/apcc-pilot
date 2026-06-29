# Roadmap APCC Pilot V2

## Vision

Transformer APCC Pilot en logiciel metier quotidien pour APCC Neuf et Renovation: cockpit commercial, campagnes, communications, devis, administratif, documents, chantiers, facturation, SAV, rapports et IA.

## Phase 1 - Socle et Experience Utilisateur

Objectif: rendre l'application claire, navigable et structurante avant d'empiler les modules.

Livrables:
- PWA installable;
- navigation applicative complete;
- sidebar repliable;
- topbar permanente;
- palette Ctrl/Cmd+K;
- campagne active;
- cockpit;
- page Ma journee;
- files de travail;
- pipeline simplifie en 8 etapes;
- sous-statuts;
- workflow perdu;
- migrations Phase 1;
- backfill campagne historique.

Risques:
- migration des statuts existants;
- conservation des filtres actuels;
- ne pas casser la synchronisation Google Sheets/ClubTravaux;
- ne pas perdre les documents clients deja crees.

## Phase 2 - Appels et Communications

Livrables:
- module appels;
- resultat d'appel;
- journal d'activite;
- adaptateur telephonie;
- WhatsApp provider abstrait;
- SMS provider abstrait;
- boite Communications;
- modele non repondu;
- sequences sans reponse;
- consentement et STOP.

Mode par defaut: validation humaine.

## Phase 3 - Campagnes et Statistiques

Livrables:
- cockpit campagne;
- KPIs cliquables;
- filtres globaux;
- graphiques interactifs;
- rapports;
- exports Excel;
- rapports PDF direction.

## Phase 4 - Documents et Administratif

Livrables:
- stockage prive;
- arborescences PAC / renovation / copropriete;
- versions;
- apercus;
- checklists MaPrimeRenov, CEE, financement;
- demandes de documents;
- portail de depot securise.

## Phase 5 - Devis et Facturation

Livrables:
- devis;
- versions;
- relances;
- signature future;
- acompte;
- factures;
- reglements;
- alertes echeances.

## Phase 6 - Chantiers

Livrables:
- creation automatique chantier apres signature;
- planning;
- phases;
- photos mobiles;
- comptes rendus;
- reception;
- reserves;
- garanties;
- SAV.

## Phase 7 - Coproprietes B2B

Livrables:
- syndics;
- gestionnaires;
- coproprietes;
- chaufferies;
- pipeline B2B;
- campagnes B2B;
- rapports.

## Phase 8 - IA et Automatisations

Livrables:
- APCC Copilot;
- suggestions;
- rapports;
- actions confirmees;
- audit des actions IA;
- workflows avances.

## Regles de Livraison

Pour chaque phase:
- branche dediee;
- migrations explicites;
- lint;
- typecheck;
- tests;
- build production;
- preview Vercel;
- validation utilisateur;
- production seulement apres validation.

## Prochaine Implementation Recommandee

Demarrer Phase 1 par:
1. migration `0002_phase1_foundation`;
2. campagne historique active;
3. mapping pipeline simplifie;
4. navigation metier complete;
5. PWA;
6. page `Ma journee`;
7. files de travail calculees.
