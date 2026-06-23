import { QueryClient } from "@tanstack/react-query";

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
