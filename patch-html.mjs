// Injecte les balises PWA / iOS dans le index.html généré par l'export web
// (mode SPA "single" : Expo ne passe pas par +html.tsx).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const file = "dist/index.html";
if (!existsSync(file)) {
  console.error("⚠️ dist/index.html introuvable — lance d'abord `expo export`.");
  process.exit(0);
}

let html = readFileSync(file, "utf8");

html = html.replace('<html lang="en">', '<html lang="fr">');

html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />',
);

const head = `
    <meta name="theme-color" content="#181A15" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="FC Littoral" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
    <style>html,body{background-color:#181A15;}</style>
  `;

if (!html.includes("apple-mobile-web-app-capable")) {
  html = html.replace("</head>", head + "</head>");
}

writeFileSync(file, html, "utf8");

// Routage SPA pour un déploiement direct du dossier dist/ (toutes les routes → index.html).
writeFileSync(
  "dist/vercel.json",
  JSON.stringify(
    { rewrites: [{ source: "/(.*)", destination: "/index.html" }] },
    null,
    2,
  ),
  "utf8",
);

console.log("✓ index.html patché (PWA iOS) + dist/vercel.json (routage SPA)");
