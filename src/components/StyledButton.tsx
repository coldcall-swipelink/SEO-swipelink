// Rendu d'un bouton stylé (composant serveur, réutilisé par le bloc bouton
// et le bloc CTA).
import { ButtonStyle } from "@/lib/types";
import { buttonInlineStyle, buttonAlignStyle } from "@/lib/button";

interface Props {
  style: ButtonStyle;
  label: string;
  url: string;
  newTab?: boolean;
}

export function StyledButton({ style, label, url, newTab }: Props) {
  return (
    <div style={buttonAlignStyle(style)}>
      <a
        href={url || "#"}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        style={buttonInlineStyle(style)}
      >
        {label || "Bouton"}
      </a>
    </div>
  );
}
