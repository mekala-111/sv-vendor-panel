"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ThemePreviewFrame.module.css";

/** Theme renderer lives in admin — preview iframe loads admin /preview/theme */
function previewBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_PANEL_URL ||
    process.env.ADMIN_PANEL_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function ThemePreviewFrame({
  payload,
  fullscreen = false,
}: {
  payload: Record<string, unknown> | null;
  fullscreen?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const src = `${previewBaseUrl()}/preview/theme`;

  const postPayload = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !payload) return;
    win.postMessage({ type: "SV_THEME_PREVIEW", payload }, "*");
  }, [payload]);

  useEffect(() => {
    setReady(false);
  }, [src]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "SV_THEME_PREVIEW_READY") {
        setReady(true);
        postPayload();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postPayload]);

  useEffect(() => {
    if (ready) postPayload();
  }, [ready, postPayload]);

  return (
    <div className={`${styles.shell} ${fullscreen ? styles.fullscreen : ""}`}>
      {!fullscreen ? (
        <div className={styles.bar}>
          <span className={styles.label}>Theme preview</span>
          <span className={styles.status}>{ready ? "Live" : "Loading…"}</span>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="Theme preview"
        src={src}
        className={styles.frame}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
