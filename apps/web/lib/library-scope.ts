export type LibraryScopeFilter = "all" | "mine" | "published";

const libraryScopeLabels = {
  en: {
    all: "All",
    mine: "Mine",
    published: "Published",
  },
  es: {
    all: "Todos",
    mine: "Míos",
    published: "Publicados",
  },
  pt: {
    all: "Todos",
    mine: "Meus",
    published: "Publicados",
  },
} as const;

export function getLibraryScopeLabels(locale: string) {
  const language = locale.split("-")[0] as keyof typeof libraryScopeLabels;

  return libraryScopeLabels[language] ?? libraryScopeLabels.en;
}
