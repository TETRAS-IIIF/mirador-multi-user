import { ReactNode, Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { LoadingSpinner } from "../components/elements/loadingSpinner.tsx";
import { queryClient } from "../lib/react-query.ts";
import { QueryClientProvider } from "@tanstack/react-query";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <QueryClientProvider client={queryClient}>
        <Router>{children}</Router>
      </QueryClientProvider>
    </Suspense>
  );
};
