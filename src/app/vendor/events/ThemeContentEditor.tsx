"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ui from "@/components/ui.module.css";
import { ThemePreviewFrame } from "@/components/ThemePreviewFrame";
import { ThemeContentFields } from "@/app/vendor/events/ThemeContentFields";
import type { ThemeFieldDef } from "@/lib/theme-config";
import {
  buildEventThemePreviewPayload,
  type VendorThemePreview,
} from "@/lib/theme-preview-payload";
import styles from "@/app/vendor/events/new/wizard.module.css";

export function ThemeContentEditor({
  eventId,
  fields,
  raw,
  theme,
  formAction,
  backHref,
  hiddenFields,
  title = "Theme Content",
  submitLabel = "Save & continue",
  description,
  banner,
}: {
  eventId: string;
  fields: ThemeFieldDef[];
  raw: Record<string, unknown>;
  theme: VendorThemePreview | null;
  formAction: (formData: FormData) => Promise<void>;
  backHref?: string;
  hiddenFields?: Record<string, string>;
  title?: string;
  description?: string;
  submitLabel?: string;
  banner?: React.ReactNode;
}) {
  const [content, setContent] = useState<Record<string, unknown>>(() => raw);

  const previewPayload = useMemo(
    () =>
      buildEventThemePreviewPayload(theme, content, {
        eventName: String(raw.eventName ?? ""),
        pageTitle: String(raw.pageTitle ?? raw.eventName ?? ""),
        coverImage: typeof raw.coverImage === "string" ? raw.coverImage : null,
        scrollMessage: typeof raw.scrollMessage === "string" ? raw.scrollMessage : null,
      }),
    [theme, content, raw]
  );

  return (
    <div className={styles.contentEditorLayout}>
      <div className={styles.contentFormPane}>
        <div className={styles.stepTitle}>{title}</div>
        {description ? (
          <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16 }}>{description}</p>
        ) : null}
        {banner}
        <form action={formAction}>
          <input type="hidden" name="eventId" value={eventId} />
          {hiddenFields
            ? Object.entries(hiddenFields).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))
            : null}
          <ThemeContentFields fields={fields} raw={raw} onContentChange={setContent} />
          <div className={styles.footerRow}>
            {backHref ? (
              <Link href={backHref} className={styles.backBtn}>
                Back
              </Link>
            ) : (
              <span />
            )}
            <button type="submit" className={backHref ? ui.btnDark : ui.btnPrimary}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.contentPreviewPane}>
        <div className={styles.contentPreviewLabel}>
          Live preview · {theme?.name ?? "Theme"}
        </div>
        <ThemePreviewFrame payload={previewPayload as Record<string, unknown>} />
      </div>
    </div>
  );
}
