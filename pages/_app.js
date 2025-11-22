// pages/_app.js
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />

      {/* Ensures camera + mic permissions show on Android Chrome */}
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=()" />

      <Component {...pageProps} />
    </>
  );
}
