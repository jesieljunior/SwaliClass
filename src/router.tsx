import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error("Router error:", error);
  }, [error]);
  return (
    <div className="p-8 max-w-lg mx-auto text-center">
      <h2 className="text-lg font-semibold">Não foi possível carregar esta página</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {(error instanceof Error && error.message) || "Ocorreu um erro inesperado."}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
        <Link
          to="/app"
          className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}

function DefaultNotFoundComponent() {
  return (
    <div className="p-8 max-w-lg mx-auto text-center">
      <h2 className="text-lg font-semibold">Página não encontrada</h2>
      <p className="mt-2 text-sm text-muted-foreground">O recurso solicitado não existe.</p>
      <div className="mt-4">
        <Link
          to="/app"
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir para o app
        </Link>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
    defaultNotFoundComponent: DefaultNotFoundComponent,
  });

  return router;
};
