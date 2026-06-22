"use client";

import { AuthProvider } from "./AuthProvider";
import { LanguageProvider } from "./LanguageProvider";
import { ToastProvider } from "./Toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>{children}</ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
