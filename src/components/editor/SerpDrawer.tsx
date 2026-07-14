"use client";

import { useCallback, useEffect, useState } from "react";
import type { SerpResult } from "@/app/api/serp/route";

interface Props {
  open: boolean;
  keyword: string;
  onClose: () => void;
}

interface SerpResponse {
  configured: boolean;
  results: SerpResult[];
  query: string;
  error?: string;
}

export function SerpDrawer({ open, keyword, onClose }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<SerpResponse | null>(null);
  const kw = keyword.trim();

  const load = useCallback(async () => {
    if (!kw) {
      setState("idle");
      setData(null);
      return;
    }
    setState("loading");
    try {
      const res = await fetch(`/api/serp?q=${encodeURIComponent(kw)}`);
      const json = (await res.json()) as SerpResponse;
      setData(json);
      setState("done");
    } catch {
      setState("error");
    }
  }, [kw]);

  // Charge à l'ouverture (ou au changement de mot-clé pendant l'ouverture).
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <>
      {/* Fond assombri */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Volet */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <div className="text-sm font-bold text-gray-900">
              Concurrence Google
            </div>
            <div className="text-xs text-gray-400">
              Top 5 résultats naturels (hors annonces)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={!kw || state === "loading"}
              title="Rafraîchir"
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              ⟳
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {kw ? (
            <p className="mb-4 text-sm text-gray-500">
              Mot-clé :{" "}
              <span className="font-semibold text-gray-800">{kw}</span>
            </p>
          ) : (
            <Empty
              title="Aucun mot-clé"
              text="Renseignez le mot-clé principal (onglet Réglages) pour voir la concurrence."
            />
          )}

          {kw && state === "loading" && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
              Recherche en cours…
            </div>
          )}

          {kw && state === "done" && data && !data.configured && (
            <Empty
              title="Recherche non configurée"
              text="Ajoutez une clé SerpApi (variable SERPAPI_KEY) pour activer l'aperçu des résultats Google. Offre gratuite sur serpapi.com."
            />
          )}

          {kw && state === "done" && data?.configured && data.error && (
            <Empty title="Erreur" text={data.error} />
          )}

          {kw &&
            state === "done" &&
            data?.configured &&
            !data.error &&
            data.results.length === 0 && (
              <Empty title="Aucun résultat" text="La recherche n'a rien renvoyé." />
            )}

          {kw && state === "error" && (
            <Empty title="Erreur" text="Impossible de contacter le service." />
          )}

          {kw && state === "done" && data?.configured && data.results.length > 0 && (
            <ol className="space-y-4">
              {data.results.map((r) => (
                <li
                  key={r.position}
                  className="rounded-xl border border-gray-100 p-4 transition hover:border-brand hover:shadow-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {r.position}
                    </span>
                    <span className="truncate text-xs text-green-700">
                      {r.displayLink}
                    </span>
                  </div>
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-base font-semibold text-[#1a0dab] hover:underline"
                  >
                    {r.title}
                  </a>
                  {r.snippet && (
                    <p className="mt-1 text-sm text-gray-600">{r.snippet}</p>
                  )}
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-brand"
                  >
                    Ouvrir la page ↗
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
      <p className="font-semibold text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}
