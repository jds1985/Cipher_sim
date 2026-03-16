import "../styles/globals.css";
import "../styles/cipher-theme.css";
import "../styles/boot.css";

import Head from "next/head";
import { useState, useEffect } from "react";

import BootScreen from "../components/BootScreen";
import EntryScreen from "../components/EntryScreen";

export default function MyApp({ Component, pageProps }) {

  const [booted, setBooted] = useState(false);
  const [entered, setEntered] = useState(true);

  useEffect(() => {
    const hasEntered = localStorage.getItem("cipher_entered");

    if (!hasEntered) {
      setEntered(false);
    }
  }, []);

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05060a" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=()" />
      </Head>

      {!booted && (
        <BootScreen onComplete={() => setBooted(true)} />
      )}

      {booted && !entered && (
        <EntryScreen
          onEnter={() => {
            localStorage.setItem("cipher_entered", "true");
            setEntered(true);
          }}
        />
      )}

      {booted && entered && (
        <Component {...pageProps} />
      )}
    </>
  );
}
