"use client";

import { ButtonStyle } from "@/lib/types";
import { buttonInlineStyle, buttonAlignStyle } from "@/lib/button";
import { Row, Segmented, ColorControl } from "./controls";

interface Props {
  style: ButtonStyle;
  onChange: (style: ButtonStyle) => void;
  previewLabel: string;
  // Masque le contrôle d'alignement (ex. bouton de CTA, piloté par l'encart).
  lockAlign?: boolean;
}

export function ButtonStyler({
  style,
  onChange,
  previewLabel,
  lockAlign,
}: Props) {
  function set<K extends keyof ButtonStyle>(key: K, value: ButtonStyle[K]) {
    onChange({ ...style, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      {/* Aperçu en direct */}
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4">
        <div style={buttonAlignStyle(style)}>
          <span style={buttonInlineStyle(style)}>{previewLabel || "Bouton"}</span>
        </div>
      </div>

      {/* Style plein / contour */}
      <Row label="Style">
        <Segmented
          value={style.variant}
          options={[
            { value: "solid", label: "Plein" },
            { value: "outline", label: "Contour" },
          ]}
          onChange={(v) => set("variant", v as ButtonStyle["variant"])}
        />
      </Row>

      {/* Couleur de fond */}
      <Row label={style.variant === "outline" ? "Couleur" : "Fond"}>
        <ColorControl
          value={style.bgColor}
          onChange={(c) => set("bgColor", c)}
        />
      </Row>

      {/* Couleur du texte (uniquement en plein) */}
      {style.variant === "solid" && (
        <Row label="Texte">
          <ColorControl
            value={style.textColor}
            onChange={(c) => set("textColor", c)}
          />
        </Row>
      )}

      {/* Taille */}
      <Row label="Taille">
        <Segmented
          value={style.size}
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
          onChange={(v) => set("size", v as ButtonStyle["size"])}
        />
      </Row>

      {/* Arrondi */}
      <Row label="Arrondi">
        <Segmented
          value={style.radius}
          options={[
            { value: "none", label: "Aucun" },
            { value: "sm", label: "Léger" },
            { value: "md", label: "Moyen" },
            { value: "full", label: "Rond" },
          ]}
          onChange={(v) => set("radius", v as ButtonStyle["radius"])}
        />
      </Row>

      {/* Alignement */}
      {!lockAlign && (
        <Row label="Alignement">
          <Segmented
            value={style.align}
            options={[
              { value: "left", label: "Gauche" },
              { value: "center", label: "Centre" },
              { value: "right", label: "Droite" },
            ]}
            onChange={(v) => set("align", v as ButtonStyle["align"])}
          />
        </Row>
      )}

      {/* Pleine largeur */}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={style.fullWidth}
          onChange={(e) => set("fullWidth", e.target.checked)}
        />
        Pleine largeur
      </label>
    </div>
  );
}
