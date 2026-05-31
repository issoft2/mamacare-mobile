import type { PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";
import { AUTH_UI } from "@/lib/authUiTokens";

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={AUTH_UI.shadowNavy} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MumCare" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="description"
          content="A calm pregnancy companion for symptoms, tracking, care team details, and supportive chat."
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/pwa/icon-192.png" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
