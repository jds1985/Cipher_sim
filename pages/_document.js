import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Allow camera + mic + fullscreen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        {/* REQUIRED for Android camera access */}
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(self)" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
