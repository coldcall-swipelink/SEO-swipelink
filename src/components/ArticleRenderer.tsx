// Rendu HTML sémantique des blocs d'un article (composant serveur).
import { Block } from "@/lib/types";

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
    case "cta":
      return (
        <div className="my-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-gray-900">{block.title}</h3>
          <p className="mb-4 text-gray-600">{block.text}</p>
          <a
            href={block.buttonUrl}
            className="inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
          >
            {block.buttonLabel}
          </a>
        </div>
      );
    case "faq":
      return (
        <div className="my-8">
          {block.title && (
            <h2 className="mb-4 text-2xl font-bold">{block.title}</h2>
          )}
          <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {block.items.map((item) => (
              <details key={item.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-2 text-gray-600">{item.answer}</p>
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
