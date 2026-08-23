"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ui from "@/components/ui.module.css";
import { ThemePreviewFrame } from "@/components/ThemePreviewFrame";
import { ThemeContentFields, initThemeContent } from "@/app/vendor/events/ThemeContentFields";
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
  const fieldKeys = useMemo(() => fields.map((f) => `${f.key}:${f.type}`).join("|"), [fields]);
  const rawToggleKey = `${String(raw.showSubEvents)}|${String(raw.showInvitationCard)}`;
  const rawContentKey = useMemo(
    () =>
      fields
        .map((field) => {
          const value = raw[field.key];
          if (Array.isArray(value)) return `${field.key}:${value.length}:${JSON.stringify(value).slice(0, 120)}`;
          return `${field.key}:${String(value ?? "")}`;
        })
        .join("|"),
    [fields, raw]
  );

  // Single source of truth for toggles + preview (hidden inputs read this same state).
  const [content, setContent] = useState(() => initThemeContent(raw, fields));

  useEffect(() => {
    setContent(initThemeContent(raw, fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server fields / values change
  }, [fieldKeys, rawToggleKey, rawContentKey]);

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
        <form action={formAction} className={styles.contentFormFlex}>
          <div className={styles.contentFormScroll}>
            <div className={styles.stepTitle}>{title}</div>
            {description ? (
              <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16 }}>{description}</p>
            ) : null}
            {banner}
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="invitationId" value={eventId} />
            {hiddenFields
              ? Object.entries(hiddenFields).map(([key, value]) => (
                  <input key={key} type="hidden" name={key} value={value} />
                ))
              : null}
            <ThemeContentFields
              fields={fields}
              content={content}
              onContentChange={setContent}
              raw={raw}
            />
          </div>
          <div className={styles.contentFormFooter}>
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
