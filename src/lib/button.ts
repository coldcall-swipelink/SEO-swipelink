// Calcul du style CSS d'un bouton à partir de sa configuration.
// Utilisé côté rendu public (serveur) comme dans l'éditeur (aperçu).
import type { CSSProperties } from "react";
import { ButtonStyle } from "./types";

const SIZES: Record<ButtonStyle["size"], CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "0.875rem" },
  md: { padding: "10px 22px", fontSize: "1rem" },
  lg: { padding: "14px 30px", fontSize: "1.125rem" },
};

const RADII: Record<ButtonStyle["radius"], string> = {
  none: "0",
  sm: "6px",
  md: "10px",
  full: "9999px",
};

export function buttonInlineStyle(s: ButtonStyle): CSSProperties {
  const base: CSSProperties = {
    display: s.fullWidth ? "block" : "inline-block",
    width: s.fullWidth ? "100%" : undefined,
    textAlign: "center",
    fontWeight: 600,
    lineHeight: 1.2,
    borderRadius: RADII[s.radius],
    textDecoration: "none",
    cursor: "pointer",
    transition: "opacity .15s ease",
    ...SIZES[s.size],
  };
  if (s.variant === "outline") {
    return {
      ...base,
      background: "transparent",
      color: s.bgColor,
      border: `2px solid ${s.bgColor}`,
    };
  }
  return {
    ...base,
    background: s.bgColor,
    color: s.textColor,
    border: "2px solid transparent",
  };
}

export function buttonAlignStyle(s: ButtonStyle): CSSProperties {
  return {
    display: "flex",
    justifyContent:
      s.align === "left"
        ? "flex-start"
        : s.align === "right"
        ? "flex-end"
        : "center",
  };
}
