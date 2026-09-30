"use client";
import { useEffect, useMemo, useState } from "react";

export function useHashTab<const T extends string>(allowed: readonly T[], fallback: T) {
  const allowedKey = useMemo(() => allowed.join("|"), [allowed]);
  const [tab, setTab] = useState<T>(fallback);
  useEffect(() => {
    const values = allowedKey.split("|") as T[];
    const sync = () => {
      const query = new URLSearchParams(window.location.search).get("view") as T | null;
      const legacyHash = window.location.hash.replace(/^#/, "") as T;
      const value = query && values.includes(query) ? query : values.includes(legacyHash) ? legacyHash : fallback;
      setTab(value);
      if (!query && values.includes(legacyHash)) {
        const params = new URLSearchParams(window.location.search); params.set("view", legacyHash);
        window.history.replaceState(window.history.state, "", `${window.location.pathname}?${params.toString()}`);
      }
    };
    sync(); window.addEventListener("popstate", sync); window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, [allowedKey, fallback]);
  const select = (value: string) => {
    const next = (allowedKey.split("|").includes(value) ? value : fallback) as T; setTab(next);
    const params = new URLSearchParams(window.location.search); params.set("view", next);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${params.toString()}`);
  };
  return [tab, select] as const;
}
