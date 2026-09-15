export type LibraryScopeFilter = "all" | "mine";

const libraryScopeLabels = {
  en: {
    all: "All",
    mine: "Mine",
  },
  es: {
    all: "Todos",
    mine: "Míos",
  },
  pt: {
    all: "Todos",
    mine: "Meus",
  },
} as const;

export function getLibraryScopeLabels(locale: string) {
  const language = locale.split("-")[0] as keyof typeof libraryScopeLabels;

  return libraryScopeLabels[language] ?? libraryScopeLabels.en;
}
