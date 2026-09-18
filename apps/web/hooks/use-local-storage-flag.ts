"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCAL_STORAGE_EVENT = "wodly:local-storage-change";

function subscribeToClient(callback: () => void) {
  window.addEventListener(LOCAL_STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(LOCAL_STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useClientReady() {
  return useSyncExternalStore(subscribeToClient, () => true, () => false);
}

export function useLocalStorageFlag(key: string) {
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key) === "true",
    [key],
  );
  const getServerSnapshot = useCallback(() => false, []);
  const value = useSyncExternalStore(
    subscribeToClient,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (nextValue: boolean) => {
      window.localStorage.setItem(key, String(nextValue));
      window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
