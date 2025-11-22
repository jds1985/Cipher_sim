// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Icons */}
        <link rel="icon" href="/icon-192.png" sizes="192x192" />
        <link rel="icon" href="/icon-256.png" sizes="256x256" />
        <link rel="icon" href="/icon-384.png" sizes="384x384" />
        <link rel="icon" href="/icon-512.png" sizes="512x512" />

        {/* Android splash fixes */}
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
