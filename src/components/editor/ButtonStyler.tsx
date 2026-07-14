"use client";

import { ButtonStyle } from "@/lib/types";
import { buttonInlineStyle, buttonAlignStyle } from "@/lib/button";

interface Props {
  style: ButtonStyle;
  onChange: (style: ButtonStyle) => void;
  previewLabel: string;
  // Masque le contrôle d'alignement (ex. bouton de CTA, toujours centré).
  lockAlign?: boolean;
}

const PRESET_COLORS = [
  "#4f46e5", "#2563eb", "#0891b2", "#16a34a", "#ca8a04",
  "#ea580c", "#dc2626", "#db2777", "#7c3aed", "#0f172a",
  "#64748b", "#ffffff",
];

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

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-sm transition ${
            value === o.value
              ? "bg-brand text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            className={`h-5 w-5 rounded-full border ${
              value.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-brand ring-offset-1"
                : "border-gray-200"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
      {/* Couleur personnalisée */}
      <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-gray-300">
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs">
          🎨
        </span>
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#4f46e5"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
