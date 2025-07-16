"use client";

import {
  ThemeProvider,
  ThemeStyleProvider,
} from "@/components/layouts/theme-provider";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark"]}
      storageKey="app-theme"
      disableTransitionOnChange
    >
      <ThemeStyleProvider>
        <HeroUIProvider>
          <div id="root">
            {children}
            <Toaster richColors />
          </div>
        </HeroUIProvider>
      </ThemeStyleProvider>
    </ThemeProvider>
  );
}
