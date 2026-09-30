"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

export type ThemePreference = "light" | "dark" | "system";
export type InterfaceLanguage = "zh-CN" | "en-US";
export type FontSizePreference = "small" | "standard" | "large";
export type HomePagePreference = "/dashboard/overview" | "/application/all" | "/student/portal";
export type PreferenceSyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export interface AppPreferences {
  theme: ThemePreference;
  language: InterfaceLanguage;
  fontSize: FontSizePreference;
  homepage: HomePagePreference;
}

interface SyncedSettings {
  version: number;
  updatedAt: string;
  interface: AppPreferences;
  notifications: Record<string, boolean>;
  security: Record<string, unknown>;
}

const STORAGE_KEY = "jhxt-interface-preferences";
export const AUTH_CHANGED_EVENT = "jhxt:auth-changed";
export const PREFERENCES_SYNCED_EVENT = "jhxt:preferences-synced";
const themes: ThemePreference[] = ["light", "dark", "system"];
const languages: InterfaceLanguage[] = ["zh-CN", "en-US"];
const fontSizes: FontSizePreference[] = ["small", "standard", "large"];
const homepages: HomePagePreference[] = ["/dashboard/overview", "/application/all", "/student/portal"];

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "system",
  language: "zh-CN",
  fontSize: "standard",
  homepage: "/dashboard/overview",
};

interface PreferencesContextValue {
  preferences: AppPreferences;
  hydrated: boolean;
  resolvedTheme: "light" | "dark";
  syncStatus: PreferenceSyncStatus;
  lastSyncedAt: string | null;
  updatePreferences: (patch: Partial<AppPreferences>) => void;
  replacePreferences: (preferences: AppPreferences) => void;
  syncPreferences: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getStoredUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "null") as { id?: string } | null;
    return user?.id ?? null;
  } catch { return null; }
}

function preferenceStorageKey(userId = getStoredUserId()) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

function preferenceDirtyKey(userId = getStoredUserId()) {
  return `${preferenceStorageKey(userId)}:dirty`;
}

function isLocalDirty(userId: string | null) {
  return localStorage.getItem(preferenceDirtyKey(userId)) === "true";
}

function setLocalDirty(dirty: boolean, userId: string | null) {
  if (dirty) localStorage.setItem(preferenceDirtyKey(userId), "true");
  else localStorage.removeItem(preferenceDirtyKey(userId));
}

function normalizePreferences(value: unknown): AppPreferences | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AppPreferences>;
  if (!languages.includes(item.language as InterfaceLanguage)
    || !fontSizes.includes(item.fontSize as FontSizePreference)
    || !homepages.includes(item.homepage as HomePagePreference)) return null;
  const legacyTheme = typeof window !== "undefined" ? localStorage.getItem("jhxt-theme") : null;
  const theme = themes.includes(item.theme as ThemePreference)
    ? item.theme as ThemePreference
    : themes.includes(legacyTheme as ThemePreference) ? legacyTheme as ThemePreference : "system";
  return { theme, language: item.language, fontSize: item.fontSize, homepage: item.homepage } as AppPreferences;
}

function readLocalPreferences(userId: string | null) {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(preferenceStorageKey(userId)) ?? "null")) ?? DEFAULT_PREFERENCES;
  } catch {
    localStorage.removeItem(preferenceStorageKey(userId));
    return DEFAULT_PREFERENCES;
  }
}

function applyDocumentPreferences(preferences: AppPreferences) {
  const root = document.documentElement;
  root.lang = preferences.language;
  root.dataset.language = preferences.language;
  root.dataset.fontSize = preferences.fontSize;
  root.dataset.themePreference = preferences.theme;
}

function emitSyncedSettings(settings: SyncedSettings) {
  window.dispatchEvent(new CustomEvent(PREFERENCES_SYNCED_EVENT, { detail: settings }));
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, resolvedTheme: nextResolvedTheme } = useTheme();
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<PreferenceSyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const preferencesRef = useRef(DEFAULT_PREFERENCES);
  const activeUserIdRef = useRef<string | null>(null);
  const revisionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef<{ preferences: AppPreferences; revision: number } | null>(null);

  const commitPreferences = useCallback((next: AppPreferences, userId = activeUserIdRef.current) => {
    preferencesRef.current = next;
    setPreferences(next);
    setTheme(next.theme);
    applyDocumentPreferences(next);
    localStorage.setItem(preferenceStorageKey(userId), JSON.stringify(next));
  }, [setTheme]);

  const enqueueSync = useCallback(async (next: AppPreferences, revision: number) => {
    pendingRef.current = { preferences: next, revision };
    if (inFlightRef.current) return;
    const token = localStorage.getItem("token");
    const userId = getStoredUserId();
    if (!token || !userId) { setSyncStatus("idle"); return; }

    inFlightRef.current = true;
    try {
      while (pendingRef.current) {
        const target = pendingRef.current;
        pendingRef.current = null;
        setSyncStatus("syncing");
        try {
          const response = await fetch("/api/settings/preferences", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ interface: target.preferences }),
            cache: "no-store",
          });
          const payload = await response.json() as { success?: boolean; data?: SyncedSettings; error?: string };
          if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "Preference synchronization failed");
          if (activeUserIdRef.current !== userId) return;
          setLastSyncedAt(payload.data.updatedAt);
          emitSyncedSettings(payload.data);
          if (!pendingRef.current && target.revision === revisionRef.current) {
            commitPreferences(payload.data.interface, userId);
            setLocalDirty(false, userId);
          }
          setSyncStatus("synced");
        } catch {
          if (activeUserIdRef.current === userId) setSyncStatus(navigator.onLine ? "error" : "offline");
          break;
        }
      }
    } finally { inFlightRef.current = false; }
  }, [commitPreferences]);

  const scheduleSync = useCallback((next: AppPreferences, revision: number) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void enqueueSync(next, revision);
    }, 320);
  }, [enqueueSync]);

  const refreshPreferences = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userId = getStoredUserId();
    if (!token || !userId || inFlightRef.current || timerRef.current !== null) return;
    if (isLocalDirty(userId)) { await enqueueSync(preferencesRef.current, revisionRef.current); return; }
    const requestedRevision = revisionRef.current;
    setSyncStatus("syncing");
    try {
      const response = await fetch("/api/settings/preferences", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json() as { success?: boolean; data?: SyncedSettings; error?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "Preference synchronization failed");
      if (activeUserIdRef.current !== userId) return;
      if (requestedRevision === revisionRef.current) {
        commitPreferences(payload.data.interface, userId);
        setLocalDirty(false, userId);
      }
      else scheduleSync(preferencesRef.current, revisionRef.current);
      setLastSyncedAt(payload.data.updatedAt);
      setSyncStatus("synced");
      emitSyncedSettings(payload.data);
    } catch {
      if (activeUserIdRef.current === userId) setSyncStatus(navigator.onLine ? "error" : "offline");
    }
  }, [commitPreferences, enqueueSync, scheduleSync]);

  const initializeForCurrentAccount = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
    const userId = getStoredUserId();
    activeUserIdRef.current = userId;
    revisionRef.current += 1;
    const localPreferences = readLocalPreferences(userId);
    commitPreferences(localPreferences, userId);
    setHydrated(true);
    if (localStorage.getItem("token") && userId) {
      if (isLocalDirty(userId)) void enqueueSync(localPreferences, revisionRef.current);
      else void refreshPreferences();
    } else setSyncStatus("idle");
  }, [commitPreferences, enqueueSync, refreshPreferences]);

  useEffect(() => {
    initializeForCurrentAccount();
    const onAuthChanged = () => initializeForCurrentAccount();
    const onOnline = () => void enqueueSync(preferencesRef.current, revisionRef.current);
    const onFocus = () => void refreshPreferences();
    const onVisibility = () => { if (document.visibilityState === "visible") void refreshPreferences(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "token" || event.key === "user") return initializeForCurrentAccount();
      if (event.key !== preferenceStorageKey(activeUserIdRef.current) || !event.newValue) return;
      const next = normalizePreferences(JSON.parse(event.newValue));
      if (!next) return;
      revisionRef.current += 1;
      commitPreferences(next);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [commitPreferences, enqueueSync, initializeForCurrentAccount, refreshPreferences]);

  const replacePreferences = useCallback((next: AppPreferences) => {
    const normalized = normalizePreferences(next);
    if (!normalized) return;
    if (isLocalDirty(activeUserIdRef.current)) {
      scheduleSync(preferencesRef.current, revisionRef.current);
      return;
    }
    revisionRef.current += 1;
    commitPreferences(normalized);
    setLocalDirty(false, activeUserIdRef.current);
  }, [commitPreferences, scheduleSync]);

  const updatePreferences = useCallback((patch: Partial<AppPreferences>) => {
    const normalized = normalizePreferences({ ...preferencesRef.current, ...patch });
    if (!normalized) return;
    revisionRef.current += 1;
    setLocalDirty(true, activeUserIdRef.current);
    commitPreferences(normalized);
    scheduleSync(normalized, revisionRef.current);
  }, [commitPreferences, scheduleSync]);

  const syncPreferences = useCallback(async () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    await enqueueSync(preferencesRef.current, revisionRef.current);
  }, [enqueueSync]);

  const resolvedTheme: "light" | "dark" = nextResolvedTheme === "dark" ? "dark" : "light";
  const value = useMemo(() => ({ preferences, hydrated, resolvedTheme, syncStatus, lastSyncedAt, updatePreferences, replacePreferences, syncPreferences, refreshPreferences }), [preferences, hydrated, resolvedTheme, syncStatus, lastSyncedAt, updatePreferences, replacePreferences, syncPreferences, refreshPreferences]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("useAppPreferences must be used within PreferencesProvider");
  return value;
}



