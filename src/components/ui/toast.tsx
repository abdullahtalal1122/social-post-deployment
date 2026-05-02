"use client";

import * as React from "react";

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

  const toast = React.useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-md border bg-card px-4 py-3 shadow-md " +
              (t.variant === "error"
                ? "border-red-200"
                : t.variant === "success"
                  ? "border-emerald-200"
                  : "border-border")
            }
          >
            <div className="text-sm font-medium">{t.title}</div>
            {t.description && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
