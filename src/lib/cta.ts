// Calcul du style CSS de l'encart CTA (la carte) à partir de sa configuration.
// Utilisé côté rendu public (site-render, chaînes HTML) comme dans l'app
// (ArticleRenderer / éditeur, objets CSSProperties).
import type { CSSProperties } from "react";
import { CtaStyle } from "./types";

export const CTA_RADII: Record<CtaStyle["radius"], string> = {
  none: "0",
  sm: "8px",
  md: "12px",
  lg: "16px", // équivalent rounded-2xl (apparence historique)
  full: "9999px",
};

export const CTA_PADDING: Record<CtaStyle["padding"], string> = {
  sm: "1rem",
  md: "1.5rem", // équivalent p-6 (apparence historique)
  lg: "2.5rem",
};

// Style de la carte pour le rendu React (aperçu éditeur + ArticleRenderer).
export function ctaCardStyle(s: CtaStyle): CSSProperties {
  return {
    margin: "2rem 0",
    padding: CTA_PADDING[s.padding],
    background: s.bgColor,
    border: s.showBorder ? `1px solid ${s.borderColor}` : "none",
    borderRadius: CTA_RADII[s.radius],
    textAlign: s.align,
  };
}
