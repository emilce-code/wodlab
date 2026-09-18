"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useActiveBox } from "./ActiveBoxContext";

export default function ActiveBoxSwitcher() {
  const t = useTranslations("boxContext");
  const { boxes, activeBox, saving, error, selectBox, clearError } = useActiveBox();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const canSwitch = boxes.length > 1;
  const filteredBoxes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return boxes.filter((box) => box.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [boxes, query]);

  useEffect(() => {
    if (!open) return;
    (searchRef.current ?? closeRef.current)?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!activeBox) return null;

  function close(restoreFocus = false) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  }

  async function chooseBox(boxId: string) {
    const changed = await selectBox(boxId);
    if (changed) close(true);
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:px-6 lg:px-10">
      <div className="relative mx-auto flex max-w-7xl justify-end">
        <button
          ref={triggerRef}
          type="button"
          disabled={!canSwitch || saving}
          aria-expanded={canSwitch ? open : undefined}
          aria-haspopup={canSwitch ? "dialog" : undefined}
          onClick={() => { clearError(); setOpen(true); }}
          className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 text-left shadow-sm transition hover:border-accent/40 disabled:cursor-default disabled:opacity-100 sm:w-auto sm:max-w-sm sm:min-w-72"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 font-black text-accent">B</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{t("label")}</span>
            <span className="block truncate text-sm font-bold">{activeBox.name}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-xs font-semibold text-accent">{t(`roles.${activeBox.role.toLowerCase()}`)}</span>
            {saving ? <span className="mt-1 block text-[10px] text-muted">{t("switching")}</span> : canSwitch ? <span aria-hidden="true" className="block text-sm text-muted">⌄</span> : null}
          </span>
        </button>

        {open && canSwitch ? (
          <>
            <button type="button" aria-label={t("close")} onClick={() => close(true)} className="fixed inset-0 z-40 bg-black/55 sm:bg-black/20" />
            <section role="dialog" aria-modal="true" aria-labelledby="active-box-dialog-title" className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-96 sm:rounded-2xl">
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />
              <div className="flex items-start justify-between gap-4 border-b border-border p-4">
                <div><h2 id="active-box-dialog-title" className="font-black">{t("title")}</h2><p className="mt-1 text-xs text-muted">{t("description")}</p></div>
                <button ref={closeRef} type="button" onClick={() => close(true)} aria-label={t("close")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-muted hover:bg-surface-elevated">×</button>
              </div>
              {boxes.length > 6 ? (
                <div className="border-b border-border p-3"><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15" /></div>
              ) : null}
              <div className="max-h-[55dvh] space-y-1 overflow-y-auto overscroll-contain p-3">
                {filteredBoxes.map((box) => {
                  const selected = box.id === activeBox.id;
                  return (
                    <button key={box.id} type="button" disabled={saving} onClick={() => void chooseBox(box.id)} className={`flex min-h-16 w-full items-center gap-3 rounded-xl border px-3 text-left transition ${selected ? "border-accent/40 bg-accent/10" : "border-transparent hover:bg-surface-elevated"}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${selected ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-muted"}`}>{selected ? "✓" : "B"}</span>
                      <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold">{box.name}</span><span className="mt-0.5 block text-xs text-muted">{t(`roles.${box.role.toLowerCase()}`)}</span></span>
                      {selected ? <span className="shrink-0 text-xs font-bold text-accent">{t("active")}</span> : null}
                    </button>
                  );
                })}
                {filteredBoxes.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">{t("noResults")}</p> : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
      {error ? <p role="alert" className="mx-auto mt-2 max-w-7xl rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">{t("error")}</p> : null}
    </div>
  );
}
