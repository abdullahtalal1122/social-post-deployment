"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";
type ToastInput = { title: string; description?: string; variant?: ToastVariant };
type Toast = ToastInput & { id: number };

type ToastContextValue = {
  toast: (t: ToastInput) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-end justify-end gap-2 p-4 sm:p-6">
        {toasts.map((t) => {
          const Icon =
            t.variant === "error"
              ? AlertCircle
              : t.variant === "success"
                ? CheckCircle2
                : Info;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft-lg animate-fade-in",
                t.variant === "error" && "border-destructive/30",
                t.variant === "success" && "border-success/40",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  t.variant === "error" && "text-destructive",
                  t.variant === "success" && "text-success",
                  (!t.variant || t.variant === "default") && "text-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-tight">{t.title}</div>
                {t.description && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
