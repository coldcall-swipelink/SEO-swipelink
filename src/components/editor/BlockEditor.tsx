"use client";

import { Block, FaqItem, defaultButtonStyle, defaultCtaStyle } from "@/lib/types";
import { uniqueId } from "@/lib/slug";
import { RichText } from "./RichText";
import { ImageUploader } from "./ImageUploader";
import { ButtonStyler } from "./ButtonStyler";
import { CtaStyler } from "./CtaStyler";

interface Props {
  block: Block;
  onChange: (block: Block) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  highlighted?: boolean;
}

const TYPE_LABELS: Record<Block["type"], string> = {
  heading: "Titre",
  paragraph: "Paragraphe",
  image: "Image",
  faq: "FAQ",
  cta: "Appel à l'action",
  button: "Bouton",
  quote: "Citation",
  list: "Liste",
  code: "Code",
  table: "Tableau",
};

export function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  highlighted,
}: Props) {
  return (
    <div
      id={`block-${block.id}`}
      className={`group relative rounded-xl border bg-white p-4 transition ${
        highlighted
          ? "block-highlight border-brand"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {TYPE_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <IconBtn onClick={onMoveUp} disabled={isFirst} title="Monter">
            ↑
          </IconBtn>
          <IconBtn onClick={onMoveDown} disabled={isLast} title="Descendre">
            ↓
          </IconBtn>
          <IconBtn onClick={onRemove} title="Supprimer" danger>
            ✕
          </IconBtn>
        </div>
      </div>

      <BlockFields block={block} onChange={onChange} />
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: Block;
  onChange: (block: Block) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <select
            value={block.level}
            onChange={(e) =>
              onChange({ ...block, level: Number(e.target.value) as 2 | 3 | 4 })
            }
            className="rounded-lg border border-gray-200 px-2 text-sm"
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
          <input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Intitulé du sous-titre"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-semibold outline-none focus:border-brand"
          />
        </div>
      );

    case "paragraph":
      return (
        <RichText
          value={block.html}
          onChange={(html) => onChange({ ...block, html })}
          placeholder="Rédigez votre paragraphe… (gras, italique, liens disponibles)"
        />
      );

    case "image":
      return (
        <div className="space-y-2">
          <ImageUploader
            value={block.src}
            onUploaded={(url) => onChange({ ...block, src: url })}
          />
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
              ou coller une URL d'image externe
            </summary>
            <input
              value={block.src}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="https://…"
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </details>
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Texte alternatif (alt) — essentiel pour le SEO et l'accessibilité"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand ${
              block.alt.trim() ? "border-gray-200" : "border-amber-300 bg-amber-50"
            }`}
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Légende (optionnelle)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      );

    case "list":
      return (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={block.ordered}
              onChange={(e) => onChange({ ...block, ordered: e.target.checked })}
            />
            Liste numérotée
          </label>
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => {
                  const items = [...block.items];
                  items[i] = e.target.value;
                  onChange({ ...block, items });
                }}
                placeholder={`Élément ${i + 1}`}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <IconBtn
                onClick={() =>
                  onChange({
                    ...block,
                    items: block.items.filter((_, idx) => idx !== i),
                  })
                }
                title="Retirer"
                danger
              >
                ✕
              </IconBtn>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="text-sm font-semibold text-brand"
          >
            + Ajouter un élément
          </button>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2">
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Texte de la citation"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 italic outline-none focus:border-brand"
          />
          <input
            value={block.cite ?? ""}
            onChange={(e) => onChange({ ...block, cite: e.target.value })}
            placeholder="Source / auteur (optionnel)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      );

    case "code":
      return (
        <div className="space-y-2">
          <input
            value={block.language}
            onChange={(e) => onChange({ ...block, language: e.target.value })}
            placeholder="Langage (ex: javascript)"
            className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
          <textarea
            value={block.code}
            onChange={(e) => onChange({ ...block, code: e.target.value })}
            placeholder="Collez votre code ici"
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-100 outline-none"
          />
        </div>
      );

    case "table":
      return <TableFields block={block} onChange={onChange} />;

    case "button":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={block.label}
              onChange={(e) => onChange({ ...block, label: e.target.value })}
              placeholder="Texte du bouton"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium outline-none focus:border-brand"
            />
            <input
              value={block.url}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
              placeholder="Lien (URL)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={block.newTab}
              onChange={(e) => onChange({ ...block, newTab: e.target.checked })}
            />
            Ouvrir dans un nouvel onglet
          </label>
          <ButtonStyler
            style={block.style}
            onChange={(style) => onChange({ ...block, style })}
            previewLabel={block.label}
          />
        </div>
      );

    case "cta":
      return (
        <div className="space-y-2">
          <input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Titre de l'encart"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-semibold outline-none focus:border-brand"
          />
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Texte d'accroche"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <input
              value={block.buttonLabel}
              onChange={(e) =>
                onChange({ ...block, buttonLabel: e.target.value })
              }
              placeholder="Libellé du bouton"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              value={block.buttonUrl}
              onChange={(e) => onChange({ ...block, buttonUrl: e.target.value })}
              placeholder="URL du bouton"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={block.buttonNewTab ?? false}
              onChange={(e) =>
                onChange({ ...block, buttonNewTab: e.target.checked })
              }
            />
            Ouvrir dans un nouvel onglet
          </label>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Style de l&apos;encart
          </div>
          <CtaStyler
            style={block.cardStyle ?? defaultCtaStyle()}
            onChange={(cardStyle) => onChange({ ...block, cardStyle })}
          />
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Style du bouton
          </div>
          <ButtonStyler
            style={{
              ...(block.buttonStyle ?? defaultButtonStyle()),
              // L'alignement du bouton suit celui de l'encart (source unique).
              align: (block.cardStyle ?? defaultCtaStyle()).align,
            }}
            onChange={(buttonStyle) =>
              onChange({ ...block, buttonStyle })
            }
            previewLabel={block.buttonLabel}
            lockAlign
          />
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          <input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Titre du bloc FAQ (optionnel)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-semibold outline-none focus:border-brand"
          />
          {block.items.map((item, i) => (
            <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">
                  Question {i + 1}
                </span>
                <IconBtn
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((it) => it.id !== item.id),
                    })
                  }
                  title="Retirer"
                  danger
                >
                  ✕
                </IconBtn>
              </div>
              <input
                value={item.question}
                onChange={(e) => updateFaqItem(block, item.id, { question: e.target.value }, onChange)}
                placeholder="Question"
                className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 font-medium outline-none focus:border-brand"
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateFaqItem(block, item.id, { answer: e.target.value }, onChange)}
                placeholder="Réponse"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                ...block,
                items: [
                  ...block.items,
                  { id: uniqueId("faq_"), question: "", answer: "" },
                ],
              })
            }
            className="text-sm font-semibold text-brand"
          >
            + Ajouter une question
          </button>
        </div>
      );

    default:
      return null;
  }
}

function TableFields({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "table" }>;
  onChange: (block: Block) => void;
}) {
  const cols = block.headers.length;

  const setHeader = (c: number, value: string) => {
    const headers = [...block.headers];
    headers[c] = value;
    onChange({ ...block, headers });
  };

  const setCell = (r: number, c: number, value: string) => {
    const rows = block.rows.map((row) => [...row]);
    rows[r][c] = value;
    onChange({ ...block, rows });
  };

  const addColumn = () => {
    onChange({
      ...block,
      headers: [...block.headers, `Colonne ${cols + 1}`],
      rows: block.rows.map((row) => [...row, ""]),
    });
  };

  const removeColumn = (c: number) => {
    if (cols <= 1) return;
    onChange({
      ...block,
      headers: block.headers.filter((_, i) => i !== c),
      rows: block.rows.map((row) => row.filter((_, i) => i !== c)),
    });
  };

  const addRow = () => {
    onChange({ ...block, rows: [...block.rows, Array(cols).fill("")] });
  };

  const removeRow = (r: number) => {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== r) });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {block.headers.map((header, c) => (
                <th key={c} className="p-1 align-bottom">
                  <div className="flex items-center gap-1">
                    <input
                      value={header}
                      onChange={(e) => setHeader(c, e.target.value)}
                      placeholder={`En-tête ${c + 1}`}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 font-semibold outline-none focus:border-brand"
                    />
                    <IconBtn
                      onClick={() => removeColumn(c)}
                      title="Supprimer la colonne"
                      disabled={cols <= 1}
                      danger
                    >
                      ✕
                    </IconBtn>
                  </div>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="p-1">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      placeholder="…"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-brand"
                    />
                  </td>
                ))}
                <td className="p-1 text-center">
                  <IconBtn
                    onClick={() => removeRow(r)}
                    title="Supprimer la ligne"
                    danger
                  >
                    ✕
                  </IconBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4">
        <button
          onClick={addRow}
          className="text-sm font-semibold text-brand"
        >
          + Ajouter une ligne
        </button>
        <button
          onClick={addColumn}
          className="text-sm font-semibold text-brand"
        >
          + Ajouter une colonne
        </button>
      </div>
      <input
        value={block.caption ?? ""}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende du tableau (optionnelle)"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}

function updateFaqItem(
  block: Extract<Block, { type: "faq" }>,
  id: string,
  patch: Partial<FaqItem>,
  onChange: (block: Block) => void
) {
  onChange({
    ...block,
    items: block.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
  });
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition disabled:opacity-30 ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
