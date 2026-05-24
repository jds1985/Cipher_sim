// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ============================================================
           🗣️ GLOBAL LOCAL AI ENGINE RUNTIME
           Injects ONNX Runtime WebGPU directly into the browser scope
        ============================================================ */}
        <script 
          src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.webgpu.min.js"
          defer
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* App Icons */}
        <link rel="icon" href="/icons/cipher_icon_512.png" />
        <link rel="apple-touch-icon" href="/icons/cipher_icon_192.png" />

        {/* Theme */}
        <meta name="theme-color" content="#000000" />

        {/* Camera + Microphone permissions */}
        <meta
          httpEquiv="Permissions-Policy"
          content="camera=(self), microphone=(self)"
        />

        {/* Service Worker */}
        <link rel="serviceworker" href="/sw.js" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
