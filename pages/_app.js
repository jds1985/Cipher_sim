import "../styles/globals.css";
import "../styles/cipher-theme.css";

import Head from "next/head";
import { useState, useEffect } from "react";

import EntryScreen from "../components/EntryScreen";

export default function MyApp({ Component, pageProps }) {
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 🔐 THE PERIMETER SECURITY LOCK
      const hasAccess = localStorage.getItem("cipher_dev_access") === "granted";

      // Whitelist matching the precise production routing format
      const allowedPages = [
        "/launch",
        "/launch.html",
        "/recruit",
        "/success"
      ];

      const currentPath = window.location.pathname.toLowerCase();

      const isAllowedPage = allowedPages.some(
        page => currentPath === page || currentPath.startsWith("/launch")
      );

      // If they are unauthorized, aggressively force them back to the fallback launch route
      if (!hasAccess && !isAllowedPage) {
        window.location.href = "/launch.html"; 
        return;
      }
      
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

      {!entered && (
        <EntryScreen
          onEnter={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("cipher_entered", "true");
            }
            setEntered(true);
          }}
        />
      )}

      {entered && (
        <Component {...pageProps} />
      )}
    </>
  );
}
