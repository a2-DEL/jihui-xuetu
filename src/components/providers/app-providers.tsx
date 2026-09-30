"use client";

import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="jhxt-theme">
      <PreferencesProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </PreferencesProvider>
    </ThemeProvider>
  );
}