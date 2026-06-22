"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

interface Toast { id: number; message: string; type: "success" | "error" | "info" }

interface ToastContextType { toast: (message: string, type?: Toast["type"]) => void }

const ToastContext = createContext<ToastContextType>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg bg-card animate-in slide-in-from-right ${
            t.type === "success" ? "border-emerald-200" : t.type === "error" ? "border-red-200" : "border-blue-200"
          }`}>
            {t.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
             t.type === "error" ? <XCircle className="h-4 w-4 text-red-500" /> :
             <AlertCircle className="h-4 w-4 text-blue-500" />}
            <span className="text-sm">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t2 => t2.id !== t.id))} className="ml-2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
