import "../styles/globals.css";
import "../styles/cipher-theme.css";
import "../styles/boot.css";

import Head from "next/head";
import { useState } from "react";
import BootScreen from "../components/BootScreen";

export default function MyApp({ Component, pageProps }) {
  const [booted, setBooted] = useState(false);

  if (!booted) {
    return <BootScreen onComplete={() => setBooted(true)} />;
  }

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
