import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

// Constants
const STALE_TIME_MS = 10_000;

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: STALE_TIME_MS } },
  });
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <NuqsAdapter>{children}</NuqsAdapter>
      </MotionConfig>
    </QueryClientProvider>
  );
}
