"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ui from "@/components/ui.module.css";
import { ThemePreviewFrame } from "@/components/ThemePreviewFrame";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import {
  buildVendorThemePreviewPayload,
  type VendorThemePreview,
} from "@/lib/theme-preview-payload";
import styles from "./themes.module.css";

export function ThemesGallery({ themes }: { themes: VendorThemePreview[] }) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewTheme = useMemo(
    () => themes.find((t) => t._id === previewId) ?? null,
    [themes, previewId]
  );

  const previewPayload = useMemo(
    () => (previewTheme ? buildVendorThemePreviewPayload(previewTheme) : null),
    [previewTheme]
  );

  useEffect(() => {
    if (!previewId) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewId]);

  if (!themes.length) return null;

  return (
    <>
      <div className={ui.grid4}>
        {themes.map((th) => (
          <div key={th._id} className={styles.themeCard}>
            <ThemePreviewImage
              previewUrl={th.previewImage}
              name={th.name}
              className={styles.stripe}
              fallbackColors={{ stripe1: th.secondary, stripe2: th.accent, primary: th.primary }}
            />
            <div className={styles.body}>
              <div className={styles.name}>{th.name}</div>
              <div className={styles.meta}>Layout: {th.layout || th.slug}</div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={ui.btnOutlineSm}
                  style={{ flex: 1, fontSize: 11.5, padding: "7px 0" }}
                  onClick={() => setPreviewId(th._id)}
                >
                  Preview
                </button>
                <Link
                  href="/vendor/events/new?step=2"
                  className={ui.btnPrimary}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "7px 0",
                    fontSize: 11.5,
                    textDecoration: "none",
                  }}
                >
                  Use in event
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewTheme ? (
        <div className={styles.previewOverlay} role="dialog" aria-modal="true" aria-label="Theme preview">
          <div className={styles.previewTopBar}>
            <div>
              <div className={styles.previewTitle}>{previewTheme.name}</div>
              <div className={styles.previewSub}>
                Guest page preview · {previewTheme.layout || previewTheme.slug}
              </div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setPreviewId(null)}
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
          <div className={styles.previewBody}>
            <ThemePreviewFrame
              payload={previewPayload as Record<string, unknown>}
              fullscreen
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
