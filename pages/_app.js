import "../styles/globals.css";
import "../styles/cipher-theme.css"; // 🔥 Cipher OS visual system

import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta
          httpEquiv="Permissions-Policy"
          content="camera=(), microphone=()"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
