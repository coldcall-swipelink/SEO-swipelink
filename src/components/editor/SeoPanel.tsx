"use client";

import { useMemo, useState } from "react";
import { Article } from "@/lib/types";
import { analyzeSeo, CheckStatus, SeoCheck } from "@/lib/seo";
import { SITE } from "@/lib/site";

const GROUP_LABELS: Record<SeoCheck["group"], string> = {
  base: "Balises de base",
  keyword: "Mot-clé principal",
  structure: "Structure du contenu",
  readability: "Lisibilité",
  links: "Liens",
  media: "Médias",
};

const STATUS_COLOR: Record<CheckStatus, string> = {
  good: "text-green-600",
  warning: "text-amber-500",
  bad: "text-red-500",
};

const STATUS_ICON: Record<CheckStatus, string> = {
  good: "●",
  warning: "●",
  bad: "●",
};

export function SeoPanel({
  article,
  onFocusCheck,
}: {
  article: Article;
  onFocusCheck?: (check: SeoCheck) => void;
}) {
  const report = useMemo(() => analyzeSeo(article), [article]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(["base", "keyword"])
  );

  const grouped = useMemo(() => {
    const map = new Map<SeoCheck["group"], SeoCheck[]>();
    for (const check of report.checks) {
      const arr = map.get(check.group) ?? [];
      arr.push(check);
      map.set(check.group, arr);
    }
    return map;
  }, [report]);

  const scoreColor =
    report.score >= 85
      ? "#16a34a"
      : report.score >= 70
      ? "#65a30d"
      : report.score >= 50
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div>
      {/* Jauge de score */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
        <ScoreRing score={report.score} color={scoreColor} />
        <div>
          <div className="text-sm text-gray-500">Score SEO</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {report.score}/100
            <span className="ml-2 text-lg font-bold" style={{ color: scoreColor }}>
              {report.grade}
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Mots" value={report.stats.words} />
        <Stat label="Lecture" value={`${report.stats.readingTimeMin} min`} />
        <Stat label="Sous-titres" value={report.stats.headings} />
        <Stat
          label="Densité mot-clé"
          value={`${report.stats.keywordDensity.toFixed(1)}%`}
        />
        <Stat label="Liens internes" value={report.stats.internalLinks} />
        <Stat label="Liens externes" value={report.stats.externalLinks} />
      </div>

      {/* Contrôles groupés */}
      <div className="mt-4 space-y-2">
        {Array.from(grouped.entries()).map(([group, checks]) => {
          const isOpen = openGroups.has(group);
          const failing = checks.filter((c) => c.status !== "good").length;
          return (
            <div
              key={group}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white"
            >
              <button
                onClick={() => {
                  const next = new Set(openGroups);
                  isOpen ? next.delete(group) : next.add(group);
                  setOpenGroups(next);
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-gray-800">
                  {GROUP_LABELS[group]}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  {failing === 0 ? (
                    <span className="text-green-600">✓ OK</span>
                  ) : (
                    <span className="text-amber-500">{failing} à revoir</span>
                  )}
                  <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>
              {isOpen && (
                <ul className="divide-y divide-gray-50 border-t border-gray-50">
                  {checks.map((check) => {
                    const actionable = check.status !== "good" && !!onFocusCheck;
                    return (
                      <li key={check.id}>
                        <button
                          type="button"
                          disabled={!actionable}
                          onClick={() => onFocusCheck?.(check)}
                          className={`flex w-full gap-3 px-4 py-2.5 text-left transition ${
                            actionable
                              ? "cursor-pointer hover:bg-indigo-50/60"
                              : "cursor-default"
                          }`}
                        >
                          <span className={`mt-0.5 text-xs ${STATUS_COLOR[check.status]}`}>
                            {STATUS_ICON[check.status]}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                              {check.label}
                              {actionable && (
                                <span className="text-xs font-normal text-brand">
                                  · localiser →
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {check.message}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Aperçu du résultat dans Google (SERP snippet).
export function GooglePreview({ article }: { article: Article }) {
  const title = article.seo.metaTitle || article.title || "Titre de la page";
  const desc =
    article.seo.metaDescription ||
    article.excerpt ||
    "La méta description apparaîtra ici. Rédigez-en une entre 120 et 160 caractères.";
  const url = `${SITE.url}/blog/${article.slug || "url-de-l-article"}`;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Aperçu Google
      </div>
      <div className="font-sans">
        <div className="truncate text-xs text-gray-600">{url}</div>
        <div className="mt-0.5 truncate text-lg text-[#1a0dab]">{title}</div>
        <div className="line-clamp-2 text-sm text-gray-600">{desc}</div>
      </div>
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#eef0f3" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}
