"use client";

import { CtaStyle } from "@/lib/types";
import { ctaCardStyle } from "@/lib/cta";
import { Row, Segmented, ColorControl } from "./controls";

interface Props {
  style: CtaStyle;
  onChange: (style: CtaStyle) => void;
}

// Panneau de personnalisation de l'encart CTA (la carte) : fond, bordure,
// arrondi, marge interne, alignement du contenu et couleurs du texte.
export function CtaStyler({ style, onChange }: Props) {
  function set<K extends keyof CtaStyle>(key: K, value: CtaStyle[K]) {
    onChange({ ...style, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      {/* Aperçu en direct de la carte */}
      <div style={{ ...ctaCardStyle(style), margin: 0 }}>
        <div
          style={{ margin: "0 0 0.25rem", fontWeight: 700, color: style.titleColor }}
        >
          Titre de l&apos;encart
        </div>
        <div style={{ fontSize: "0.875rem", color: style.textColor }}>
          Aperçu du texte d&apos;accroche.
        </div>
      </div>

      {/* Fond */}
      <Row label="Fond">
        <ColorControl value={style.bgColor} onChange={(c) => set("bgColor", c)} />
      </Row>

      {/* Bordure */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={style.showBorder}
          onChange={(e) => set("showBorder", e.target.checked)}
        />
        Afficher une bordure
      </label>
      {style.showBorder && (
        <Row label="Bordure">
          <ColorControl
            value={style.borderColor}
            onChange={(c) => set("borderColor", c)}
          />
        </Row>
      )}

      {/* Arrondi */}
      <Row label="Arrondi">
        <Segmented
          value={style.radius}
          options={[
            { value: "none", label: "Aucun" },
            { value: "sm", label: "Léger" },
            { value: "md", label: "Moyen" },
            { value: "lg", label: "Grand" },
            { value: "full", label: "Rond" },
          ]}
          onChange={(v) => set("radius", v as CtaStyle["radius"])}
        />
      </Row>

      {/* Marge interne */}
      <Row label="Marge interne">
        <Segmented
          value={style.padding}
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
          onChange={(v) => set("padding", v as CtaStyle["padding"])}
        />
      </Row>

      {/* Alignement du contenu */}
      <Row label="Alignement">
        <Segmented
          value={style.align}
          options={[
            { value: "left", label: "Gauche" },
            { value: "center", label: "Centre" },
            { value: "right", label: "Droite" },
          ]}
          onChange={(v) => set("align", v as CtaStyle["align"])}
        />
      </Row>

      {/* Couleur du titre */}
      <Row label="Titre">
        <ColorControl
          value={style.titleColor}
          onChange={(c) => set("titleColor", c)}
        />
      </Row>

      {/* Couleur du texte */}
      <Row label="Texte">
        <ColorControl
          value={style.textColor}
          onChange={(c) => set("textColor", c)}
        />
      </Row>
    </div>
  );
}
