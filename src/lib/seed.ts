// Article de démonstration inséré au premier lancement.
import { Article } from "./types";

export function seedArticles(): Article[] {
  const now = "2026-07-01T09:00:00.000Z";
  return [
    {
      id: "demo-seo-guide",
      title: "Le guide complet du SEO on-page en 2026",
      slug: "guide-complet-seo-on-page-2026",
      excerpt:
        "Découvrez les techniques d'optimisation on-page qui font vraiment la différence : structure, balises méta, données structurées et maillage interne.",
      coverImage:
        "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&q=80",
      author: "Équipe SwipeLink",
      status: "published",
      blocks: [
        {
          id: "b1",
          type: "paragraph",
          html: "Le <strong>SEO on-page</strong> reste le levier le plus rentable pour gagner en visibilité. Dans ce guide, nous couvrons chaque étape, de la <a href=\"/blog/guide-complet-seo-on-page-2026\">structure de contenu</a> jusqu'aux données structurées.",
        },
        {
          id: "b2",
          type: "heading",
          level: 2,
          text: "Pourquoi la structure du contenu compte",
        },
        {
          id: "b3",
          type: "paragraph",
          html: "Une hiérarchie de titres claire aide Google à comprendre votre page. Utilisez un seul <strong>H1</strong>, puis des <strong>H2</strong> et <strong>H3</strong> pour organiser les idées.",
        },
        {
          id: "b4",
          type: "image",
          src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
          alt: "Tableau de bord d'analyse SEO montrant des courbes de trafic",
          caption: "Suivre ses positions permet d'ajuster sa stratégie.",
        },
        {
          id: "b5",
          type: "list",
          ordered: false,
          items: [
            "Rédigez une balise title unique de 50 à 60 caractères",
            "Soignez la méta description pour améliorer le taux de clic",
            "Ajoutez des données structurées (Article, FAQ)",
          ],
        },
        {
          id: "b6",
          type: "faq",
          title: "Questions fréquentes",
          items: [
            {
              id: "f1",
              question: "Combien de temps pour voir des résultats SEO ?",
              answer:
                "Comptez généralement 3 à 6 mois pour observer un impact significatif sur un contenu bien optimisé.",
            },
            {
              id: "f2",
              question: "Faut-il un mot-clé par page ?",
              answer:
                "Oui, ciblez un mot-clé principal par page, entouré de variantes sémantiques.",
            },
          ],
        },
        {
          id: "b7",
          type: "cta",
          title: "Prêt à publier un contenu parfaitement optimisé ?",
          text: "Créez votre premier article et laissez l'analyse SEO vous guider.",
          buttonLabel: "Créer un article",
          buttonUrl: "/dashboard",
        },
      ],
      seo: {
        metaTitle: "Guide complet du SEO on-page en 2026 | SwipeLink",
        metaDescription:
          "Maîtrisez le SEO on-page en 2026 : structure de contenu, balises méta, données structurées et maillage interne. Un guide pas à pas pour bien vous positionner.",
        focusKeyword: "seo on-page",
        canonicalUrl: "",
        ogImage:
          "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200&q=80",
        noindex: false,
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
  ];
}
