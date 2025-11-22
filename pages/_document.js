// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* App Icons */}
        <link rel="icon" href="/icon-512.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Theme */}
        <meta name="theme-color" content="#000000" />

        {/* Camera + Microphone permissions */}
        <meta
          httpEquiv="Permissions-Policy"
          content="camera=(self), microphone=(self)"
        />

        {/* Service Worker */}
        <link rel="serviceworker" href="/sw.js" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
