// Rendu HTML sémantique des blocs d'un article (composant serveur).
import { Block, defaultButtonStyle } from "@/lib/types";
import { StyledButton } from "./StyledButton";

export function ArticleRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-article">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${block.level}` as unknown) as keyof React.JSX.IntrinsicElements;
      return <Tag id={slugAnchor(block.text)}>{block.text}</Tag>;
    }
    case "paragraph":
      // rendu dans un div : le contenu enrichi peut contenir titres/listes,
      // qui ne peuvent pas être imbriqués dans un <p>.
      return (
        <div
          className="rt-content"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "image":
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            loading="lazy"
            className="w-full rounded-xl"
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-gray-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "list":
      return block.ordered ? (
        <ol>
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote>
          {block.text}
          {block.cite && (
            <cite className="mt-2 block text-sm not-italic text-gray-500">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      );
    case "code":
      return (
        <pre className="my-6 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100">
          <code>{block.code}</code>
        </pre>
      );
    case "button":
      return (
        <div className="my-6">
          <StyledButton
            style={block.style}
            label={block.label}
            url={block.url}
            newTab={block.newTab}
          />
        </div>
      );
    case "cta":
      return (
        <div className="my-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-gray-900">{block.title}</h3>
          <p className="mb-4 text-gray-600">{block.text}</p>
          <StyledButton
            // Un CTA est un encart centré : le bouton est toujours centré.
            style={{
              ...(block.buttonStyle ?? defaultButtonStyle()),
              align: "center",
            }}
            label={block.buttonLabel}
            url={block.buttonUrl}
            newTab={block.buttonNewTab}
          />
        </div>
      );
    case "faq":
      return (
        <div className="my-8">
          {block.title && (
            <h2 className="mb-1 text-2xl font-bold">{block.title}</h2>
          )}
          <p className="mb-4 text-sm text-gray-400">
            Cliquez sur une question pour afficher la réponse.
          </p>
          <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {block.items.map((item) => (
              <details key={item.id} className="faq-item">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-900 transition marker:hidden hover:bg-gray-50">
                  <span>{item.question}</span>
                  <svg
                    className="faq-chevron h-5 w-5 shrink-0 text-brand"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 8l4 4 4-4" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-gray-600">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
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
