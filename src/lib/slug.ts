// Génération et normalisation de slugs SEO-friendly.

export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFD") // décompose les accents
    .replace(/[̀-ͯ]/g, "") // supprime les diacritiques
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // caractères non alphanumériques
    .replace(/\s+/g, "-") // espaces -> tirets
    .replace(/-+/g, "-") // tirets multiples
    .replace(/^-+|-+$/g, ""); // tirets en bord
}

export function uniqueId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}
