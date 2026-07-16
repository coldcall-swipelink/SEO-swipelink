"use client";

// Contrôles de formulaire réutilisables par les panneaux de style
// (ButtonStyler, CtaStyler) : ligne libellée, choix segmenté, sélecteur
// de couleur avec palette de préréglages + couleur libre.

export const PRESET_COLORS = [
  "#4f46e5", "#2563eb", "#0891b2", "#16a34a", "#ca8a04",
  "#ea580c", "#dc2626", "#db2777", "#7c3aed", "#0f172a",
  "#64748b", "#ffffff",
];

export function Row({
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

export function Segmented({
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

export function ColorControl({
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
