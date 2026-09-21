export function safePostLoginPath(locale: string, requested?: string) {
  const fallback = `/${locale}/dashboard`;

  if (!requested || !requested.startsWith("/") || requested.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(requested, "https://wodly.local");
    const localeRoot = `/${locale}`;

    if (
      url.origin !== "https://wodly.local" ||
      (url.pathname !== localeRoot && !url.pathname.startsWith(`${localeRoot}/`))
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authenticationCompletionPath(locale: string, destination: string) {
  const params = new URLSearchParams({ returnTo: destination });
  return `/${locale}/auth/complete?${params.toString()}`;
}
