"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive";
interface Toast { id: string; title?: string; description?: string; variant?: ToastVariant }

export function useToast() {
  const toast = React.useCallback((item: Omit<Toast, "id">) => {
    const method = item.variant === "destructive" ? sonnerToast.error : sonnerToast.success;
    return method(item.title ?? (item.variant === "destructive" ? "操作失败" : "操作成功"), { description: item.description });
  }, []);
  const dismiss = React.useCallback((id?: string | number) => sonnerToast.dismiss(id), []);
  return { toasts: [] as Toast[], toast, dismiss };
}