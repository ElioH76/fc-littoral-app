#!/usr/bin/env node
/**
 * Crée les comptes Supabase Auth + profils (joueurs & coachs) de l'app FC Littoral.
 *
 *   Identifiant : "prenom.nom"      → email technique prenom.nom@fclittoral.fr
 *   Mot de passe : initiales-littoral (ex. Elio Hardouin → "eh-littoral")
 *
 * Prérequis : avoir exécuté schema.sql PUIS accounts.sql dans Supabase.
 * ⚠️ Nécessite la clé SERVICE_ROLE (clé admin) — à NE JAMAIS committer ni partager.
 *
 * Usage (PowerShell, depuis le dossier app/) :
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ...service_role..."
 *   node scripts/seed-accounts.mjs
 *
 * Idempotent : relançable à volonté (met à jour le mot de passe si le compte existe).
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = "fclittoral.fr";

if (!URL || !KEY) {
  console.error(
    "❌ Définis SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l'environnement.",
  );
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// — Effectif (doit refléter la table members) + encadrement —
const players = [
  ["Vincent", "Malandain", 1],
  ["Théo", "Debris", 2],
  ["Thomas", "Cocault-Duverger", 3],
  ["Corentin", "Savalle", 4],
  ["Elio", "Hardouin", 5],
  ["Adrien", "Debris", 6],
  ["Alban", "Pusset", 7],
  ["Erwan", "Ligney", 8],
  ["Alexandre", "Ferreira Moreira", 9],
  ["Mathys", "Linquier", 10],
  ["Benjamin", "Friboulet", 11],
  ["Mattéo", "Ebersvillier", 12],
  ["Noam", "Julien", 13],
  ["Axel", "Hauchecorne", 14],
  ["Thomas", "Guérout", 15],
  ["Valentin", "Joly", 16],
  ["William", "Tassel", 17],
  ["Mathis", "Hardouin", 18],
].map(([firstName, lastName, number]) => ({ firstName, lastName, number, role: "player" }));

// Coachs : pas de nom de famille fourni → identifiant = prénom seul,
// suffixé ".coach" pour le distinguer clairement d'un éventuel joueur homonyme.
const coaches = [
  { firstName: "Fabrice", lastName: "", role: "coach", loginSuffix: "coach" },
  { firstName: "Vincent", lastName: "", role: "coach", loginSuffix: "coach" },
];

const roster = [...players, ...coaches];

const strip = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (s) => strip(s).toLowerCase().trim().replace(/\s+/g, "-");

function loginFor(p) {
  const base = p.lastName ? `${slug(p.firstName)}.${slug(p.lastName)}` : slug(p.firstName);
  return p.loginSuffix ? `${base}.${p.loginSuffix}` : base;
}
function passwordFor(p) {
  const ini = strip(p.firstName[0] + (p.lastName ? p.lastName.trim()[0] : "")).toLowerCase();
  return `${ini}-littoral`;
}

async function main() {
  // 1) Comptes existants (pagination) pour rester idempotent.
  const existing = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) existing.set((u.email || "").toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }

  // 2) Lier les profils joueurs à leur fiche `members` (par numéro).
  const { data: members, error: memErr } = await admin
    .from("members")
    .select("id, number");
  if (memErr) throw memErr;
  const memberByNumber = new Map((members ?? []).map((m) => [m.number, m.id]));

  let created = 0;
  let updated = 0;
  console.log("\n  rôle    identifiant                    mot de passe");
  console.log("  ─────────────────────────────────────────────────────");

  for (const p of roster) {
    const login = loginFor(p);
    const email = `${login}@${DOMAIN}`;
    const password = passwordFor(p);
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
    const meta = { login, full_name: fullName, role: p.role };

    let userId = existing.get(email.toLowerCase());
    if (userId) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: meta,
      });
      if (error) { console.error(`⚠️  ${login}: ${error.message}`); continue; }
      updated++;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: meta,
      });
      if (error) { console.error(`⚠️  ${login}: ${error.message}`); continue; }
      userId = data.user.id;
      created++;
    }

    const { error: pErr } = await admin.from("profiles").upsert(
      {
        id: userId,
        login,
        full_name: fullName,
        role: p.role,
        member_id: p.role === "player" ? memberByNumber.get(p.number) ?? null : null,
      },
      { onConflict: "id" },
    );
    if (pErr) console.error(`⚠️  profil ${login}: ${pErr.message}`);

    console.log(`  ${p.role.padEnd(7)} ${login.padEnd(30)} ${password}`);
  }

  console.log(
    `\n✅ Terminé — ${created} créé(s), ${updated} mis à jour, ${roster.length} comptes au total.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
