import "../styles/globals.css"; // Regular web styles
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  // No locks, no gatekeeping, no entry screens. 
  // Just serve the public marketing and stripe pages cleanly.
  return (
    <>
      <Head>
        <title>Cipher Tech</title>
        <meta name="theme-color" content="#05060a" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
