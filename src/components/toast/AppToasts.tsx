"use client";

import { Suspense, type ReactNode } from "react";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { FlashToasts } from "@/components/toast/FlashToasts";
import { ActionToasts } from "@/components/toast/ActionToasts";

export function AppToasts({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <FlashToasts />
      </Suspense>
      <ActionToasts />
      {children}
    </ToastProvider>
  );
}
