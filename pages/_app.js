import "../styles/globals.css";
import "../styles/cipher-theme.css";
import "../styles/boot.css";

import Head from "next/head";
import { useState, useEffect } from "react";

import BootScreen from "../components/BootScreen";
import EntryScreen from "../components/EntryScreen";

export default function MyApp({ Component, pageProps }) {
  const [booted, setBooted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 🔐 THE SECURITY PERIMETER LOCK
      const hasAccess = localStorage.getItem("cipher_dev_access") === "granted";

      // Your exact whitelist of allowed public pages
      const allowedPages = [
        "/launch",
        "/recruit",
        "/success"
      ];

      const currentPath = window.location.pathname.toLowerCase();

      // Check if the current path matches anything on your whitelist
      const isAllowedPage = allowedPages.some(
        page => currentPath === page || currentPath === `${page}.html`
      );

      // If they don't have access and aren't on an allowed public page, SMASH THE WALL
      if (!hasAccess && !isAllowedPage) {
        window.location.href = "/launch"; // Securely routes to your launch page component
        return;
      }
      
      // Verification logic for the inner entry sequence
      const hasEntered = localStorage.getItem("cipher_entered");
      if (hasEntered) setEntered(true);
    }

    setReady(true);
  }, []);

  if (!ready) return null;

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
            if (typeof window !== "undefined") {
              localStorage.setItem("cipher_entered", "true");
            }
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
