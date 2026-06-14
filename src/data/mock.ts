/** Données fictives pour la Phase 1 (remplacées par Supabase + FFF en phase 2). */

export const me = {
  initials: "EH",
  firstName: "Elio",
  lastName: "Hardouin",
  team: "Seniors Après-Midi",
  number: 5,
  position: "Défenseur central",
};

export const nextMatch = {
  competition: "Championnat · J13",
  home: "FC Littoral",
  homeShort: "FCL",
  away: "Olympique Vallée",
  awayShort: "OV",
  date: "15 JUN",
  time: "15h00",
  venue: "Stade Municipal",
  day: "Dim.",
};

export const convocation = {
  status: "En attente" as "En attente" | "Présent" | "Absent",
  team: "Seniors Après-Midi · J13",
  title: "Seras-tu là pour le derby de juin ?",
  highlight: "derby de juin",
  venue: "Stade Municipal",
  meet: "Vestiaire A · 13h45",
  kit: "Maillot Domicile",
  kitSub: "Tenue or & vert",
};

export const myStats = [
  { value: "12", label: "Matchs", sub: "↑ +2", accent: true },
  { value: "3", label: "Buts", sub: "⚽ 1 assist", accent: false },
  { value: "87%", label: "Présence", sub: "↑ Top 3", accent: false },
];

export const standings = [
  { rank: 1, team: "FC Littoral", played: 12, diff: "+22", pts: 29, us: true, color: "#F5C800" },
  { rank: 2, team: "Ol. Vallée", played: 12, diff: "+15", pts: 26, us: false, color: "#4A7FC1" },
  { rank: 3, team: "AS Bord de Mer", played: 12, diff: "+12", pts: 24, us: false, color: "#C14A4A" },
  { rank: 4, team: "US Rivière", played: 12, diff: "+4", pts: 20, us: false, color: "#888888" },
  { rank: 5, team: "FC Coteaux", played: 12, diff: "-3", pts: 16, us: false, color: "#7A5AC1" },
];

export type Result = {
  id: string;
  outcome: "V" | "N" | "D";
  teams: string;
  meta: string;
  score: string;
};

export const results: Result[] = [
  { id: "r1", outcome: "V", teams: "FC Littoral vs AC Falaises", meta: "Champ. · J12 · 25 mai", score: "4 – 1" },
  { id: "r2", outcome: "V", teams: "US Rivière vs FC Littoral", meta: "Champ. · J11 · 18 mai", score: "1 – 3" },
  { id: "r3", outcome: "N", teams: "FC Littoral vs Étoile du Port", meta: "Champ. · J10 · 11 mai", score: "2 – 2" },
];

export const news = [
  { id: "n1", emoji: "🥇", cat: "Résultat", date: "25 mai 2024", title: "Derby gagné face à US Rivière !" },
  { id: "n2", emoji: "👕", cat: "Club", date: "12 mai 2024", title: "Nouveaux maillots 2024/2025 dévoilés" },
  { id: "n3", emoji: "🏆", cat: "Jeunes", date: "8 mai 2024", title: "U13 brillent au tournoi de printemps" },
];

export type EventItem = {
  id: string;
  type: "match" | "training";
  title: string;
  opponent?: string;
  date: string;
  weekday: string;
  day: string;
  month: string;
  time: string;
  venue: string;
  status: "Présent" | "Absent" | "En attente";
};

export const events: EventItem[] = [
  { id: "e1", type: "match", title: "Championnat · J13", opponent: "Olympique Vallée", date: "2024-06-15", weekday: "DIM", day: "15", month: "JUIN", time: "15h00", venue: "Stade Municipal", status: "En attente" },
  { id: "e2", type: "training", title: "Entraînement", date: "2024-06-12", weekday: "JEU", day: "12", month: "JUIN", time: "19h00", venue: "Stade Municipal", status: "Présent" },
  { id: "e3", type: "training", title: "Entraînement", date: "2024-06-10", weekday: "MAR", day: "10", month: "JUIN", time: "19h00", venue: "Stade Municipal", status: "Présent" },
  { id: "e4", type: "match", title: "Championnat · J12", opponent: "AC Falaises", date: "2024-05-25", weekday: "DIM", day: "25", month: "MAI", time: "15h00", venue: "Stade Municipal", status: "Présent" },
];

export type PlayerItem = {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position: string;
  group: "Gardiens" | "Défenseurs" | "Milieux" | "Attaquants";
  goals: number;
  matches: number;
  captain?: boolean;
};

// Effectif réel — équipe fanion (Seniors Après-Midi), aligné sur le site.
export const players: PlayerItem[] = [
  { id: "p1", firstName: "Vincent", lastName: "Malandain", number: 1, position: "Gardien", group: "Gardiens", goals: 0, matches: 0 },
  { id: "p2", firstName: "Théo", lastName: "Debris", number: 2, position: "Piston droit", group: "Défenseurs", goals: 16, matches: 0 },
  { id: "p3", firstName: "Thomas", lastName: "Cocault-Duverger", number: 3, position: "Latéral gauche", group: "Défenseurs", goals: 4, matches: 0 },
  { id: "p4", firstName: "Corentin", lastName: "Savalle", number: 4, position: "Défenseur central", group: "Défenseurs", goals: 3, matches: 0 },
  { id: "p5", firstName: "Elio", lastName: "Hardouin", number: 5, position: "Défenseur central", group: "Défenseurs", goals: 9, matches: 0, captain: true },
  { id: "p6", firstName: "Adrien", lastName: "Debris", number: 6, position: "Milieu défensif", group: "Milieux", goals: 8, matches: 0 },
  { id: "p7", firstName: "Alban", lastName: "Pusset", number: 7, position: "Ailier", group: "Attaquants", goals: 12, matches: 0 },
  { id: "p8", firstName: "Erwan", lastName: "Ligney", number: 8, position: "Milieu", group: "Milieux", goals: 10, matches: 0 },
  { id: "p9", firstName: "Alexandre", lastName: "Ferreira Moreira", number: 9, position: "Buteur", group: "Attaquants", goals: 17, matches: 0 },
  { id: "p10", firstName: "Mathys", lastName: "Linquier", number: 10, position: "Milieu offensif", group: "Milieux", goals: 24, matches: 0 },
  { id: "p11", firstName: "Benjamin", lastName: "Friboulet", number: 11, position: "Ailier", group: "Attaquants", goals: 28, matches: 0 },
  { id: "p12", firstName: "Mattéo", lastName: "Ebersvillier", number: 12, position: "Milieu défensif", group: "Milieux", goals: 3, matches: 0 },
  { id: "p13", firstName: "Noam", lastName: "Julien", number: 13, position: "Ailier", group: "Attaquants", goals: 2, matches: 0 },
  { id: "p14", firstName: "Axel", lastName: "Hauchecorne", number: 14, position: "Ailier", group: "Attaquants", goals: 0, matches: 0 },
  { id: "p15", firstName: "Thomas", lastName: "Guérout", number: 15, position: "Latéral droit", group: "Défenseurs", goals: 0, matches: 0 },
  { id: "p16", firstName: "Valentin", lastName: "Joly", number: 16, position: "Milieu", group: "Milieux", goals: 7, matches: 0 },
  { id: "p17", firstName: "William", lastName: "Tassel", number: 17, position: "Défenseur central", group: "Défenseurs", goals: 2, matches: 0 },
  { id: "p18", firstName: "Mathis", lastName: "Hardouin", number: 18, position: "Milieu offensif", group: "Milieux", goals: 15, matches: 0 },
];
