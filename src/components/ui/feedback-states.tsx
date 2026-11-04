import React from "react";
import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function LoadingState({ message = "Carregando dados…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-navy-800/60 bg-white border border-border-subtle rounded-lg">
      <Loader2 className="size-6 animate-spin text-navy-600 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nenhum registro encontrado",
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white border border-dashed border-border-subtle rounded-lg">
      <div className="size-12 rounded-full bg-navy-900/5 flex items-center justify-center text-navy-800/60 mb-3">
        <Icon className="size-6" />
      </div>
      <h3 className="font-display font-bold text-base text-navy-900">{title}</h3>
      {description && <p className="text-sm text-navy-800/60 max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 h-9 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Ocorreu um erro ao carregar os dados",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-rose-50/50 border border-rose-200 rounded-lg text-rose-800">
      <AlertCircle className="size-8 text-rose-600 mb-2" />
      <h3 className="font-display font-bold text-base text-rose-900">{title}</h3>
      {message && <p className="text-xs text-rose-700/80 max-w-md mt-1 mb-4">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 h-8 bg-white border border-rose-300 text-rose-700 rounded-sm text-xs font-semibold hover:bg-rose-100/50 transition-colors"
        >
          <RefreshCw className="size-3" /> Tentar novamente
        </button>
      )}
    </div>
  );
}
