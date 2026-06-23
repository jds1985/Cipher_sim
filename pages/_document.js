import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Clean, standard metadata for the public web page */}
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#05060a" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
