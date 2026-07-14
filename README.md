# SwipeLink SEO

SaaS de publication d'articles de blog avec **gestion SEO on-page avancée**. Rédigez
avec un éditeur par blocs, optimisez en temps réel grâce à une analyse type
Yoast/RankMath, puis publiez des pages parfaitement structurées pour Google.

> Première version (MVP). Le stockage se fait dans un fichier JSON local
> (`data/articles.json`), volontairement simple à remplacer par une vraie base de
> données par la suite.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- Stockage fichier JSON (aucune base de données à configurer)

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

- `/` — page d'accueil (landing)
- `/dashboard` — liste et création d'articles
- `/editor/[id]` — éditeur avec analyse SEO
- `/blog` — blog public
- `/blog/[slug]` — article publié (metadata + JSON-LD)
- `/sitemap.xml` et `/robots.txt` — générés dynamiquement

## Fonctionnalités SEO

### Éditeur par blocs
Paragraphes en **texte enrichi** (gras, italique, **liens hypertexte**), titres
(H2/H3/H4), images avec `alt` et légende, **FAQ dynamiques**, appels à l'action,
citations, listes et blocs de code. Réordonnancement et suppression des blocs.

### Analyse SEO en temps réel
Panneau latéral façon Yoast/RankMath avec **score sur 100** et note (A-D) :

- Longueur de la balise **title** et de la **méta description**
- Présence et **densité du mot-clé principal** (title, description, URL, intro, sous-titres)
- **Longueur du contenu**, nombre de sous-titres, présence d'un bloc FAQ
- **Lisibilité** : longueur des phrases et des paragraphes
- **Maillage** : liens internes et externes
- **Médias** : présence d'images et de leurs textes alternatifs, image de partage

### Métadonnées & partage
Balise title, méta description, **slug** éditable, extrait, auteur, image de
couverture, **image Open Graph**, **URL canonique**, option **noindex**.
Aperçu du rendu dans les résultats **Google** (SERP).

### Données structurées (JSON-LD)
Génération automatique des schémas **BlogPosting**, **FAQPage** (rich snippets) et
**BreadcrumbList**, plus Open Graph et Twitter Cards sur chaque article publié.

### Technique
`sitemap.xml` et `robots.txt` dynamiques, URLs canoniques, balises `robots`
respectant l'option noindex, images en `loading="lazy"`.

## Prochaines étapes possibles

- Authentification et multi-utilisateurs
- Base de données (Postgres/SQLite) et upload d'images
- Suggestions de mots-clés et analyse concurrentielle
- Planification de publication, catégories et tags
- Historique de versions
