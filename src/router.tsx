import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { getContext } from "./context";
import { Provider } from "./providers";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const rqContext = getContext();

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return <Provider {...rqContext}>{props.children}</Provider>;
    },
    // NuqsAdapter reads the router on mount, so it must render inside the router context
    InnerWrap: NuqsAdapter,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};
