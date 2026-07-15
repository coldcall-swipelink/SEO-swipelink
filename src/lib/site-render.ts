// Génère des pages HTML statiques (article + cartes de liste) au design
// exact de la landing page swipelink.fr, à partir des articles de l'app.
// Ces fichiers sont ensuite poussés dans le repo du site (voir publish-site.ts).
import { Article, Block, ButtonStyle, defaultButtonStyle } from "./types";
import { SITE } from "./site";
import { extractText } from "./seo";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "./jsonld";

// --- Utilitaires -----------------------------------------------------------

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugAnchor(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function readingTimeMin(blocks: Block[]): number {
  const words = extractText(blocks).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// --- Boutons (réplique de lib/button.ts en CSS inline) ---------------------

function buttonCss(s: ButtonStyle): string {
  const sizes: Record<ButtonStyle["size"], string> = {
    sm: "padding:6px 14px;font-size:0.875rem",
    md: "padding:10px 22px;font-size:1rem",
    lg: "padding:14px 30px;font-size:1.125rem",
  };
  const radii: Record<ButtonStyle["radius"], string> = {
    none: "0",
    sm: "6px",
    md: "10px",
    full: "9999px",
  };
  const base =
    `display:${s.fullWidth ? "block" : "inline-block"};` +
    (s.fullWidth ? "width:100%;" : "") +
    "text-align:center;font-weight:600;line-height:1.2;text-decoration:none;cursor:pointer;" +
    `border-radius:${radii[s.radius]};${sizes[s.size]};`;
  if (s.variant === "outline") {
    return `${base}background:transparent;color:${s.bgColor};border:2px solid ${s.bgColor}`;
  }
  return `${base}background:${s.bgColor};color:${s.textColor};border:2px solid transparent`;
}

function renderButton(
  style: ButtonStyle,
  label: string,
  url: string,
  newTab?: boolean
): string {
  const justify =
    style.align === "left"
      ? "flex-start"
      : style.align === "right"
      ? "flex-end"
      : "center";
  const target = newTab ? ' target="_blank" rel="noopener"' : "";
  return (
    `<div style="display:flex;justify-content:${justify};margin:1.75rem 0">` +
    `<a href="${esc(url)}"${target} style="${buttonCss(style)}">${esc(label)}</a>` +
    `</div>`
  );
}

// --- Rendu des blocs -------------------------------------------------------

const CHEVRON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

function renderBlock(b: Block): string {
  switch (b.type) {
    case "heading":
      return `<h${b.level} id="${slugAnchor(b.text)}">${esc(b.text)}</h${b.level}>`;
    case "paragraph":
      // Contenu déjà en HTML enrichi (gras, liens…), écrit dans l'éditeur.
      return b.html;
    case "image":
      return (
        `<figure><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy" decoding="async">` +
        (b.caption
          ? `<figcaption style="margin-top:.5rem;text-align:center;font-size:.9rem;color:var(--muted)">${esc(
              b.caption
            )}</figcaption>`
          : "") +
        `</figure>`
      );
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag}>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</${tag}>`;
    }
    case "quote":
      return (
        `<blockquote>${esc(b.text)}` +
        (b.cite
          ? `<cite style="display:block;margin-top:.5rem;font-size:.9rem;font-style:normal;color:var(--muted)">— ${esc(
              b.cite
            )}</cite>`
          : "") +
        `</blockquote>`
      );
    case "code":
      return `<pre style="margin:1.75rem 0;overflow-x:auto;border-radius:var(--r);background:#0a2540;color:#e2e8f0;padding:1.25rem;font-size:.9rem"><code>${esc(
        b.code
      )}</code></pre>`;
    case "button":
      return renderButton(b.style, b.label, b.url, b.newTab);
    case "cta": {
      const style: ButtonStyle = {
        ...(b.buttonStyle ?? defaultButtonStyle()),
        align: "center",
      };
      return (
        `<div style="margin:2.5rem 0;padding:2rem;background:var(--bg-soft);border:1px solid var(--border);border-radius:var(--r-lg);text-align:center">` +
        `<h3 style="margin:0 0 .5rem">${esc(b.title)}</h3>` +
        `<p style="margin:0 0 1.25rem;color:var(--text-soft)">${esc(b.text)}</p>` +
        renderButton(style, b.buttonLabel, b.buttonUrl, b.buttonNewTab) +
        `</div>`
      );
    }
    case "faq": {
      const items = b.items
        .map(
          (it) =>
            `<details class="faq-item"><summary>${esc(
              it.question
            )}<span class="arrow">${CHEVRON}</span></summary>` +
            `<div class="faq-content">${esc(it.answer)}</div></details>`
        )
        .join("");
      return (
        (b.title ? `<h2>${esc(b.title)}</h2>` : "") +
        `<div class="faq" style="margin:1.5rem auto 0">${items}</div>`
      );
    }
    default:
      return "";
  }
}

// --- Coquille du site (barre de nav + pied de page, DA identique) ----------

const NAVBAR = `<header class="navbar">
  <div class="container navbar-inner">
    <a href="/" class="navbar-logo" aria-label="Swipelink, Accueil">
      <img src="https://cdn.prod.website-files.com/68063d6ee4f168da919e702d/6809da68f1c03b3ee7389a27_Swipelink%20BLEU.png" alt="Swipelink" decoding="async" fetchpriority="high">
    </a>
    <nav>
      <ul class="navbar-links">
        <li><a href="/">Accueil</a></li>
        <li><a href="/a-propos">À propos</a></li>
        <li><a href="/tarifs">Tarifs</a></li>
        <li><a href="/blog" class="active">Blog</a></li>
        <li><a href="/#api">API</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
    <div class="navbar-actions">
      <a href="https://app.swipelink.fr/recruiter/auth" class="btn btn-outline btn-sm">Se connecter</a>
      <a href="https://calendar.app.google/DrpxSVXXZdmPwbrh7" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Demander une démo</a>
    </div>
    <button class="mobile-toggle" aria-label="Menu" aria-expanded="false"><span></span></button>
  </div>
</header>`;

const BOTTOM_CTA = `<section class="section" style="padding-top:0;">
  <div class="container">
    <div class="cta-banner" data-reveal>
      <h2>Prêt à recruter mieux, plus vite ?</h2>
      <p>15 minutes de démo suffisent à voir comment SMARTLINK trouve vos prochains talents.</p>
      <div class="hero-cta">
        <a href="https://calendar.app.google/DrpxSVXXZdmPwbrh7" target="_blank" rel="noopener" class="btn-liquid btn-lg-liquid">Demander une démo
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
        <a href="https://app.swipelink.fr/recruiter/auth" class="btn btn-light btn-lg">J'ai déjà un compte</a>
      </div>
    </div>
  </div>
</section>`;

const FOOTER = `<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <h4>Recrutez mieux, plus vite, plus simplement.</h4>
        <div class="footer-social">
          <a href="https://fr.linkedin.com/company/swipelink" aria-label="LinkedIn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm2 6h2.5v9H7zm1.25-3a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 9h2.4v1.3c.5-.8 1.5-1.5 2.85-1.5 2.05 0 3.25 1.35 3.25 3.7V18H18v-4.8c0-1.15-.45-1.95-1.5-1.95s-1.65.7-1.65 1.95V18H12V9z"/></svg></a>
          <a href="https://www.instagram.com/swipelink.fr/" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3H8C5.24 3 3 5.24 3 8v8c0 2.76 2.24 5 5 5h8c2.76 0 5-2.24 5-5V8c0-2.76-2.24-5-5-5zm3.25 13c0 1.79-1.46 3.25-3.25 3.25H8c-1.79 0-3.25-1.46-3.25-3.25V8c0-1.79 1.46-3.25 3.25-3.25h8c1.79 0 3.25 1.46 3.25 3.25v8zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 7.25A2.75 2.75 0 1 1 12 9a2.75 2.75 0 0 1 0 5.75zM16.75 6.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg></a>
        </div>
      </div>
      <div class="footer-col">
        <h5>Pages</h5>
        <a href="/">Accueil</a>
        <a href="/a-propos">À propos</a>
        <a href="/tarifs">Tarifs</a>
        <a href="/blog">Blog</a>
        <a href="/contact">Contact</a>
      </div>
      <div class="footer-col">
        <h5>Nous contacter</h5>
        <a href="mailto:contact@swipelink.fr">contact@swipelink.fr</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2024 Swipelink · Tous droits réservés</span>
      <div>
        <a href="/#">Politique de confidentialité</a>
        <a href="/#">Mentions légales</a>
      </div>
    </div>
  </div>
</footer>`;

const FAVICON =
  "https://cdn.prod.website-files.com/68063d6ee4f168da919e702d/680b522768ad433ffc9edf66_safeimagekit-Capture%20d%27%C3%A9cran%202025-04-22%20164446.png";

// --- Page article ----------------------------------------------------------

// `view` est la vue publique de l'article (instantané publié superposé).
export function renderArticlePage(view: Article): string {
  const title = view.seo.metaTitle || view.title;
  const description = view.seo.metaDescription || view.excerpt;
  const canonical = view.seo.canonicalUrl || `${SITE.url}/blog/${view.slug}`;
  const ogImage = view.seo.ogImage || view.coverImage;
  const rt = readingTimeMin(view.blocks);

  const publishedDate = view.publishedAt
    ? new Date(view.publishedAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const faqLd = faqJsonLd(view);
  const jsonLd = [
    articleJsonLd(view),
    breadcrumbJsonLd(view),
    ...(faqLd ? [faqLd] : []),
  ]
    .map(
      (o) =>
        `<script type="application/ld+json">${JSON.stringify(o)}</script>`
    )
    .join("\n");

  const metaLine = [
    view.author ? `Par ${esc(view.author)}` : "",
    `${rt} min de lecture`,
    publishedDate ? esc(publishedDate) : "",
  ]
    .filter(Boolean)
    .join(" &middot; ");

  const cover = view.coverImage
    ? `<div class="container"><img src="${esc(
        view.coverImage
      )}" alt="${esc(
        view.title
      )}" style="width:100%;max-width:900px;margin:0 auto 2.5rem;border-radius:var(--r-lg);box-shadow:var(--shadow)"></div>`
    : "";

  const body = view.blocks.map(renderBlock).join("\n");

  return `<!DOCTYPE html>
<html lang="fr-FR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=2">
<link rel="icon" href="${FAVICON}" />
${view.seo.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${esc(canonical)}" />
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : ""}
<meta property="og:locale" content="${SITE.locale}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}" />` : ""}
${jsonLd}
</head>
<body>

<a href="#main" class="skip-link">Aller au contenu</a>

${NAVBAR}

<main id="main">

<section class="page-header">
  <div class="hero-blob b1"></div>
  <div class="hero-blob b2"></div>
  <div class="container">
    <span class="eyebrow" data-reveal>Blog</span>
    <h1 data-reveal data-reveal-delay="100">${esc(view.title)}</h1>
    <p data-reveal data-reveal-delay="200">${metaLine}</p>
  </div>
</section>

${cover}

<section class="section" style="padding-top:0;">
  <div class="container">
    <article class="prose">
${body}
    </article>
    <p style="max-width:720px;margin:3rem auto 0"><a href="/blog" class="btn btn-outline btn-sm">← Retour au blog</a></p>
  </div>
</section>

${BOTTOM_CTA}

</main>

${FOOTER}

<script src="/assets/script.js" defer></script>
</body>
</html>
`;
}

// --- Cartes de la liste (/blog) --------------------------------------------

// `tags` : correspondance id d'article -> libellé (nom de catégorie), optionnel.
export function renderBlogCards(
  articles: Article[],
  tags: Record<string, string> = {}
): string {
  const visible = articles.filter((a) => !a.isTemplate);
  if (visible.length === 0) {
    return `<p style="grid-column:1/-1;text-align:center;color:var(--text-soft)">Aucun article publié pour le moment.</p>`;
  }
  return visible
    .map((a) => {
      const slug = a.published?.slug ?? a.slug;
      const rt = readingTimeMin(a.blocks);
      const tag = tags[a.id];
      const image = a.coverImage
        ? `<div class="blog-card-image"><img src="${esc(
            a.coverImage
          )}" alt="${esc(a.title)}" loading="lazy" decoding="async"></div>`
        : `<div class="blog-card-image"></div>`;
      return `<a href="/blog/${esc(slug)}" class="blog-card">
        ${image}
        <div class="blog-card-body">
          ${tag ? `<span class="blog-card-tag">${esc(tag)}</span>` : ""}
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.excerpt)}</p>
          <span class="blog-card-meta">${rt} min de lecture</span>
        </div>
      </a>`;
    })
    .join("\n");
}
