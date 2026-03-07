import ryeFont from "@fontsource/rye/files/rye-latin-400-normal.woff2?url";
import ryeFontExt from "@fontsource/rye/files/rye-latin-ext-400-normal.woff2?url";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Background } from "@/components/Background";
import appCss from "../styles.css?url";
import {
  WEBSITE_DESCRIPTION,
  WEBSITE_IMAGE,
  WEBSITE_NAME,
  WEBSITE_URL,
} from ".";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      // Name
      { title: WEBSITE_NAME },
      { name: "og:site_name", content: WEBSITE_NAME },
      { name: "og:title", content: WEBSITE_NAME },
      { name: "twitter:title", content: WEBSITE_NAME },
      { name: "apple-mobile-web-app-title", content: WEBSITE_NAME },
      // Description
      { name: "og:description", content: WEBSITE_DESCRIPTION },
      { name: "twitter:description", content: WEBSITE_DESCRIPTION },
      // Image
      { name: "og:image", content: WEBSITE_IMAGE },
      { name: "og:image:width", content: "1200" },
      { name: "og:image:height", content: "630" },
      { name: "og:image:type", content: "image/png" },
      { name: "twitter:image", content: WEBSITE_IMAGE },
      // URL
      { name: "og:url", content: WEBSITE_URL },
      { name: "twitter:url", content: WEBSITE_URL },
    ],
    links: [
      // CSS
      { rel: "stylesheet", href: appCss },
      { rel: "preload", as: "style", href: appCss },
      // Fonts
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
        href: ryeFont,
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
        href: ryeFontExt,
      },
      // Favicon
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png",
        sizes: "96x96",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
      {
        name: "Favicon author link",
        content: "https://www.flaticon.com/free-icons/horse-riding",
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="pointer-fine:overscroll-none font-sans">
      <head>
        <HeadContent />
      </head>
      <body>
        <Background />
        <main className="relative z-10">{children}</main>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: "Tanstack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
