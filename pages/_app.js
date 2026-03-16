import "../styles/globals.css";
import "../styles/cipher-theme.css";
import "../styles/boot.css";

import Head from "next/head";
import { useState, useEffect } from "react";
import BootScreen from "../components/BootScreen";

export default function MyApp({ Component, pageProps }) {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBooted(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05060a" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=()" />
      </Head>

      {/* Your normal app */}
      <Component {...pageProps} />

      {/* Boot overlay */}
      {!booted && <BootScreen />}
    </>
  );
}
