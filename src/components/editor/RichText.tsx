"use client";

import { useEffect, useRef, useState } from "react";

interface RichTextProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const BLOCK_STYLES: { tag: string; label: string; hint: string }[] = [
  { tag: "P", label: "Corps de texte", hint: "Paragraphe" },
  { tag: "H2", label: "Titre 2", hint: "Section principale" },
  { tag: "H3", label: "Titre 3", hint: "Sous-section" },
  { tag: "H4", label: "Titre 4", hint: "Niveau de détail" },
];

const TEXT_COLORS = [
  "#10131a", "#64748b", "#dc2626", "#ea580c", "#16a34a",
  "#2563eb", "#7c3aed", "#4f46e5",
];
const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bae6fd", "#fbcfe8", "#fed7aa",
  "#e5e7eb", "transparent",
];

type Popover = "style" | "text-color" | "highlight" | "link" | null;

export function RichText({ value, onChange, placeholder }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<Popover>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(false);
  const savedRange = useRef<Range | null>(null);
  // Lien en cours d'édition (sélection posée sur un <a> existant).
  const editingAnchor = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  // Trouve le lien <a> englobant la sélection courante (dans l'éditeur).
  function anchorInSelection(): HTMLAnchorElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !ref.current) return null;
    let node: Node | null = sel.anchorNode;
    if (!node || !ref.current.contains(node)) return null;
    while (node && node !== ref.current) {
      if (node instanceof HTMLAnchorElement) return node;
      node = node.parentNode;
    }
    return null;
  }

  // Applique (ou retire) l'ouverture dans un nouvel onglet sur un lien.
  function setNewTab(a: HTMLAnchorElement, newTab: boolean) {
    if (newTab) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    } else {
      a.removeAttribute("target");
      a.removeAttribute("rel");
    }
  }

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    restoreSelection();
    // styleWithCSS produit des styles inline (couleurs) plutôt que des balises <font>.
    if (["foreColor", "hiliteColor", "backColor"].includes(command)) {
      document.execCommand("styleWithCSS", false, "true");
    }
    document.execCommand(command, false, arg);
    emit();
  }

  function applyBlock(tag: string) {
    exec("formatBlock", tag);
    setPopover(null);
  }

  function applyColor(kind: "text" | "highlight", color: string) {
    if (kind === "text") {
      exec("foreColor", color);
    } else {
      // hiliteColor : Chrome/Firefox ; backColor : secours Safari
      ref.current?.focus();
      restoreSelection();
      document.execCommand("styleWithCSS", false, "true");
      const ok = document.execCommand("hiliteColor", false, color);
      if (!ok) document.execCommand("backColor", false, color);
      emit();
    }
    setPopover(null);
  }

  function openPopover(p: Popover) {
    saveSelection();
    if (p === "link") {
      // Pré-remplit avec le lien existant si la sélection est déjà sur un <a>.
      const a = anchorInSelection();
      editingAnchor.current = a;
      setLinkUrl(a ? a.getAttribute("href") || "" : "");
      setLinkNewTab(a ? a.getAttribute("target") === "_blank" : false);
    }
    setPopover((cur) => (cur === p ? null : p));
  }

  function applyLink() {
    const url = linkUrl.trim();

    // Édition d'un lien existant : met à jour (ou retire) sans imbriquer.
    if (editingAnchor.current) {
      const a = editingAnchor.current;
      if (url) {
        a.setAttribute("href", url);
        setNewTab(a, linkNewTab);
      } else {
        // Champ vidé → retire le lien en conservant le texte.
        const parent = a.parentNode;
        while (a.firstChild) parent?.insertBefore(a.firstChild, a);
        parent?.removeChild(a);
      }
      editingAnchor.current = null;
      emit();
      setPopover(null);
      return;
    }

    if (!url) {
      setPopover(null);
      return;
    }
    ref.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) {
      const attrs = linkNewTab
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      document.execCommand("insertHTML", false, `<a href="${url}"${attrs}>${url}</a>`);
    } else {
      document.execCommand("createLink", false, url);
      // execCommand ne pose pas target : on l'applique sur le lien créé.
      const created = anchorInSelection();
      if (created) setNewTab(created, linkNewTab);
    }
    emit();
    setPopover(null);
  }

  return (
    <div className="relative">
      <div className="mb-1.5 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {/* Style de bloc */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openPopover("style")}
            className="flex h-7 items-center gap-1 rounded px-2 text-sm text-gray-700 hover:bg-gray-200"
            title="Style de texte"
          >
            Style ▾
          </button>
          {popover === "style" && (
            <div className="absolute left-0 top-8 z-20 w-52 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
              {BLOCK_STYLES.map((s) => (
                <button
                  key={s.tag}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlock(s.tag)}
                  className="flex w-full flex-col items-start rounded px-3 py-1.5 text-left hover:bg-gray-50"
                >
                  <span
                    className={
                      s.tag === "H2"
                        ? "text-lg font-bold"
                        : s.tag === "H3"
                        ? "text-base font-bold"
                        : s.tag === "H4"
                        ? "text-sm font-bold"
                        : "text-sm"
                    }
                  >
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-400">{s.hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <TB onClick={() => exec("bold")} title="Gras"><span className="font-bold">B</span></TB>
        <TB onClick={() => exec("italic")} title="Italique"><span className="italic">I</span></TB>
        <TB onClick={() => exec("underline")} title="Souligné"><span className="underline">U</span></TB>
        <TB onClick={() => exec("strikeThrough")} title="Barré"><span className="line-through">S</span></TB>

        <Divider />

        {/* Couleur du texte */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openPopover("text-color")}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-200"
            title="Couleur du texte"
          >
            <span className="text-sm font-bold" style={{ borderBottom: "3px solid #4f46e5" }}>
              A
            </span>
          </button>
          {popover === "text-color" && (
            <ColorGrid colors={TEXT_COLORS} onPick={(c) => applyColor("text", c)} />
          )}
        </div>

        {/* Surlignage */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openPopover("highlight")}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-200"
            title="Surlignage"
          >
            🖍️
          </button>
          {popover === "highlight" && (
            <ColorGrid colors={HIGHLIGHT_COLORS} onPick={(c) => applyColor("highlight", c)} />
          )}
        </div>

        <Divider />

        <TB onClick={() => openPopover("link")} title="Insérer un lien">🔗</TB>
        <TB onClick={() => exec("unlink")} title="Retirer le lien">⛓️‍💥</TB>
        <TB onClick={() => exec("insertUnorderedList")} title="Liste à puces">•</TB>
        <TB onClick={() => exec("insertOrderedList")} title="Liste numérotée">1.</TB>

        <Divider />

        <TB onClick={() => exec("removeFormat")} title="Effacer la mise en forme">⌫</TB>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rt-editor min-h-[90px] rounded-lg border border-gray-200 bg-white px-3 py-2 leading-relaxed outline-none focus:border-brand"
      />

      {popover === "link" && (
        <div className="absolute z-20 mt-1 flex w-80 flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyLink()}
            placeholder="https://exemple.com ou /blog/mon-article"
            className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand"
          />
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={linkNewTab}
              onChange={(e) => setLinkNewTab(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Ouvrir dans un nouvel onglet
          </label>
          <div className="flex justify-end gap-2">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPopover(null)}
              className="rounded px-2 py-1 text-sm text-gray-500"
            >
              Annuler
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={applyLink}
              className="rounded bg-brand px-3 py-1 text-sm font-semibold text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorGrid({
  colors,
  onPick,
}: {
  colors: string[];
  onPick: (c: string) => void;
}) {
  return (
    <div className="absolute left-0 top-8 z-20 grid w-40 grid-cols-4 gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(c)}
          title={c === "transparent" ? "Aucun" : c}
          className="h-6 w-6 rounded border border-gray-200"
          style={{
            background:
              c === "transparent"
                ? "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 8px 8px"
                : c,
          }}
        />
      ))}
    </div>
  );
}

function TB({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-sm text-gray-700 hover:bg-gray-200"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-gray-300" />;
}
