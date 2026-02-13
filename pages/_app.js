import "../styles/globals.css";
import "../styles/cipher-theme.css";

import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05060a" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=()" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
