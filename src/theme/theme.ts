/**
 * Thème de l'appli FC Littoral — refonte DA (alignée sur le site web).
 * Sombre premium · or mat / vert / violet · Anton + Archivo + Manrope.
 */
export const colors = {
  // Verts
  vert: "#16923F",
  vertDk: "#0F5E2A",
  vertLt: "#2BD06B",
  greenBright: "#2BD06B",
  // Or
  or: "#C9A227",
  orDk: "#A9871C",
  orBright: "#EAC451",
  // Violet (nouvel accent — issu du maillot gardien)
  violet: "#7E3FF2",
  violetBright: "#A06CFF",
  // Fonds sombres
  noir: "#070A07",
  bg: "#181A15", // fond d'écran — charcoal équilibré (léger vert, peu d'olive)
  ink2: "#131510", // chrome (header/tab/modals) + texte sur or
  gris1: "#181A15", // fond d'écran
  gris2: "#252A22", // cartes / surfaces (nettement plus claires que le fond)
  gris3: "#353B30", // bordures
  gris4: "#49503F",
  // Surfaces claires (ex. carte classement)
  paper: "#F4F1E9",
  paper2: "#FFFFFF",
  inkMute: "#5A6058",
  lineD: "rgba(10,16,10,0.12)",
  // Texte
  txt: "#F0EFE8",
  txtDim: "#9A9C92",
  blanc: "#FFFFFF",
  // États
  win: "#2BD06B",
  lose: "#E05555",
  draw: "#A06CFF",
  // Lignes
  line: "rgba(255,255,255,0.10)",
  line2: "rgba(255,255,255,0.18)",
};

/** Familles de polices (chargées dans le layout racine). */
export const font = {
  body: "Manrope_400Regular",
  bodyMed: "Manrope_500Medium",
  bodySemi: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
  condSemi: "Archivo_700Bold", // labels / sous-titres
  cond: "Archivo_800ExtraBold", // titres / boutons
  condBlack: "Archivo_900Black", // gros titres
  display: "Anton_400Regular", // scores · chiffres · nom du club
};

export const radius = {
  sm: 11,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};
