"use client";

import { useEffect, useRef, useState } from "react";

interface RichTextProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Éditeur de texte enrichi minimaliste basé sur contentEditable.
// Prend en charge : gras, italique, et liens hypertexte (exigence clé pour le SEO).
export function RichText({ value, onChange, placeholder }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const savedRange = useRef<Range | null>(null);

  // Synchronise la valeur externe sans casser le curseur pendant la frappe.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
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

  function openLink() {
    saveSelection();
    setLinkUrl("");
    setShowLink(true);
  }

  function applyLink() {
    if (!linkUrl.trim()) {
      setShowLink(false);
      return;
    }
    restoreSelection();
    // Si aucune sélection, on insère l'URL comme texte du lien.
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) {
      exec("insertHTML", `<a href="${linkUrl}">${linkUrl}</a>`);
    } else {
      exec("createLink", linkUrl);
    }
    setShowLink(false);
  }

  return (
    <div className="relative">
      <div className="mb-1.5 flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <ToolbarButton onClick={() => exec("bold")} title="Gras">
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italique">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton onClick={openLink} title="Insérer un lien">
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("unlink")} title="Retirer le lien">
          ⛓️‍💥
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton
          onClick={() => exec("insertUnorderedList")}
          title="Liste à puces"
        >
          •
        </ToolbarButton>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rt-editor min-h-[80px] rounded-lg border border-gray-200 bg-white px-3 py-2 leading-relaxed outline-none focus:border-brand"
      />

      {showLink && (
        <div className="absolute z-10 mt-1 flex gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyLink()}
            placeholder="https://exemple.com ou /blog/mon-article"
            className="w-72 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={applyLink}
            className="rounded bg-brand px-3 py-1 text-sm font-semibold text-white"
          >
            OK
          </button>
          <button
            onClick={() => setShowLink(false)}
            className="rounded px-2 py-1 text-sm text-gray-500"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
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
