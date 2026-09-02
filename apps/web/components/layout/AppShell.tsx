import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import MobileNavigation from "./MobileNavigation";
import Sidebar from "./Sidebar";

type Props = {
  children: ReactNode;

  user: {
    email: string;
    athleteProfile?: {
      displayName?: string | null;
    } | null;
  };
};

export default async function AppShell({ children, user }: Props) {
  const t = await getTranslations("navigation");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-foreground"
      >
        {t("skipToContent")}
      </a>

      <div className="flex min-h-screen">
        <Sidebar user={user} />

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-5 py-6 pb-24 sm:px-8 lg:px-10 lg:py-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
