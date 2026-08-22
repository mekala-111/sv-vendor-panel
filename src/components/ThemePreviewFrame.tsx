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
  const [failed, setFailed] = useState(false);
  const src = `${previewBaseUrl()}/preview/theme`;

  const postPayload = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !payload) return;
    win.postMessage({ type: "SV_THEME_PREVIEW", payload }, "*");
  }, [payload]);

  const requestReady = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: "SV_THEME_PREVIEW_REQUEST" }, "*");
  }, []);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "SV_THEME_PREVIEW_READY") {
        setReady(true);
        setFailed(false);
        postPayload();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postPayload]);

  useEffect(() => {
    if (ready) postPayload();
  }, [ready, postPayload]);

  // Keep asking for READY until connected; only mark failed if iframe never loads.
  useEffect(() => {
    if (ready) return undefined;
    requestReady();
    const id = window.setInterval(requestReady, 600);
    return () => window.clearInterval(id);
  }, [ready, requestReady, src]);

  return (
    <div className={`${styles.shell} ${fullscreen ? styles.fullscreen : ""}`}>
      {!fullscreen ? (
        <div className={styles.bar}>
          <span className={styles.label}>Theme preview</span>
          <span className={styles.status}>
            {failed ? "Unavailable" : ready ? "Live" : "Loading…"}
          </span>
        </div>
      ) : null}
      {failed && !ready ? (
        <div className={styles.errorBox}>
          <p>Preview could not load from the admin panel.</p>
          <p className={styles.errorHint}>
            Start the admin app or set <code>NEXT_PUBLIC_ADMIN_PANEL_URL</code> to a reachable host
            (currently <code>{previewBaseUrl()}</code>), then open <code>/preview/theme</code>.
          </p>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="Theme preview"
        src={src}
        className={styles.frame}
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => {
          setFailed(false);
          setReady(true);
          requestReady();
          // Push payload immediately — child listens for SV_THEME_PREVIEW even without READY.
          window.setTimeout(postPayload, 50);
          window.setTimeout(postPayload, 300);
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
