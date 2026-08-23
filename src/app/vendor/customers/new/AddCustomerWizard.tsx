import Link from "next/link";
import { redirect } from "next/navigation";
import ui from "@/components/ui.module.css";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { ThemeContentEditor } from "@/app/vendor/events/ThemeContentEditor";
import { CopyLinkButton } from "@/app/vendor/events/new/WizardClient";
import { filterThemesForWizardKind } from "@/lib/event-kind";
import { resolveThemeFields } from "@/lib/theme-config";
import { withResolvedThemeSectionToggles } from "@/lib/theme-section-toggles";
import {
  saveCustomerThemeContentAction,
  submitCustomerSetupAction,
} from "@/lib/customer-actions";
import {
  ensureContentFillTokenAction,
  fetchEvent,
  fetchInvitation,
  fetchThemes,
} from "@/lib/server-data";
import type { CustomerContentRecordKind } from "@/lib/server-data";
import type { VendorThemePreview } from "@/lib/theme-preview-payload";
import { getConfiguredPublicEventBase } from "@/lib/public-event-url";
import styles from "@/app/vendor/events/new/wizard.module.css";

const STEPS = ["Select theme", "Theme content"] as const;

function contentFillUrlFromRecord(raw: Record<string, unknown>) {
  const token = raw.contentFillToken;
  if (typeof token !== "string" || !token) return null;
  const base = getConfiguredPublicEventBase().replace(/\/+$/, "");
  return `${base}/fill/${encodeURIComponent(token)}`;
}

function resolveShareUrl(
  raw: Record<string, unknown>,
  fillLink: { contentFillToken?: string; contentFillUrl?: string } | null
) {
  const fromRecord = contentFillUrlFromRecord(raw);
  if (fromRecord) return fromRecord;
  if (fillLink?.contentFillUrl) return fillLink.contentFillUrl;
  if (fillLink?.contentFillToken) return contentFillUrlFromRecord({ contentFillToken: fillLink.contentFillToken });
  return null;
}

export async function AddCustomerWizard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const stepRaw = Array.isArray(sp.step) ? sp.step[0] : sp.step;
  const step = stepRaw === "2" ? 2 : 1;
  const customerId = Array.isArray(sp.customerId) ? sp.customerId[0] : sp.customerId;
  const invitationId = Array.isArray(sp.invitationId) ? sp.invitationId[0] : sp.invitationId;
  const eventId = Array.isArray(sp.eventId) ? sp.eventId[0] : sp.eventId;
  const kindRaw = Array.isArray(sp.kind) ? sp.kind[0] : sp.kind;
  const recordKind: CustomerContentRecordKind =
    kindRaw === "event" || (!kindRaw && eventId) ? "event" : "invitation";
  const recordId =
    recordKind === "event"
      ? (eventId ?? invitationId ?? "")
      : (invitationId ?? eventId ?? "");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const errorMsg = Array.isArray(sp.msg) ? sp.msg[0] : sp.msg;
  const saved = Array.isArray(sp.saved) ? sp.saved[0] : sp.saved;

  if (step === 2 && (!customerId || !recordId)) {
    redirect("/vendor/customers/new?step=1");
  }

  let fillLink: { contentFillToken?: string; contentFillUrl?: string } | null = null;
  let fillLinkError: string | null = null;

  const [themes, contentRecord] = await Promise.all([
    fetchThemes(),
    step === 2 && recordId
      ? recordKind === "event"
        ? fetchEvent(recordId)
        : fetchInvitation(recordId)
      : Promise.resolve(null),
  ]);

  if (step === 2 && recordId) {
    try {
      fillLink = await ensureContentFillTokenAction(recordId, recordKind);
    } catch (err) {
      fillLinkError =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "Could not generate share link.";
    }
  }

  const availableThemes = filterThemesForWizardKind(themes, "invitation");

  if (step === 2 && recordId && !contentRecord) {
    redirect("/vendor/customers/new?step=1&error=1");
  }

  const raw = (contentRecord?.raw ?? {}) as Record<string, unknown>;
  const currentThemeId =
    (raw.themeConfig as { themeId?: string } | undefined)?.themeId || raw.themeId;
  const appliedTheme = themes.find((t) => t._id === currentThemeId);
  const themeContentFields = resolveThemeFields(appliedTheme ?? null);
  const contentRaw = withResolvedThemeSectionToggles(raw);
  const shareUrl = resolveShareUrl(raw, fillLink);

  return (
    <>
      <Link href="/vendor/customers" className={ui.backLink}>
        &larr; Back to Customers
      </Link>
      <h1 className={ui.pageTitle} style={{ marginBottom: 8 }}>
        Add customer
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 20 }}>
        Step {step} of 2 — {STEPS[step - 1]}
      </p>

      <div className={styles.stepsRow} style={{ maxWidth: 420, margin: "0 auto 24px" }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className={styles.step}>
              <div
                className={styles.stepCircle}
                style={{
                  background: active || done ? "var(--accent)" : "var(--surface-2)",
                  color: active || done ? "#fff" : "var(--muted)",
                  border: active || done ? "none" : "1px solid var(--border)",
                }}
              >
                {n}
              </div>
              <div className={styles.stepLabel} style={{ color: active ? "var(--text)" : "var(--muted)" }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {(error || errorMsg) ? (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(228,54,43,0.1)",
            color: "#c62828",
            fontSize: 13,
          }}
        >
          {errorMsg ||
            (error === "email_in_use"
              ? "That email is already registered. Use a different email, or remove the duplicate customer from the Customers list."
              : "Something went wrong. Check the details and try again.")}
        </div>
      ) : null}

      {step === 1 ? (
        <form action={submitCustomerSetupAction} className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Customer & theme</div>
          <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 20 }}>
            Enter customer details and pick a theme. You can fill content yourself or share a link with the customer.
          </p>
          <div className={styles.formGrid} style={{ marginBottom: 24 }}>
            <div>
              <label className={ui.label} htmlFor="name">
                Customer name
              </label>
              <input id="name" name="name" className={ui.input} required placeholder="Full name" />
            </div>
            <div>
              <label className={ui.label} htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" className={ui.input} required placeholder="email@example.com" />
            </div>
            <div>
              <label className={ui.label} htmlFor="phone">
                Phone (optional)
              </label>
              <input id="phone" name="phone" className={ui.input} placeholder="+91 …" />
            </div>
            <div>
              <label className={ui.label} htmlFor="invitationName">
                Invitation title
              </label>
              <input
                id="invitationName"
                name="invitationName"
                className={ui.input}
                required
                placeholder="e.g. Rahul & Priya Wedding"
              />
            </div>
          </div>

          <div className={ui.label} style={{ marginBottom: 12 }}>
            Select theme
          </div>
          <div className={styles.themeGrid}>
            {availableThemes.map((theme) => (
              <label key={theme._id} className={styles.themeCard}>
                <input type="radio" name="themeId" value={theme._id} required style={{ display: "none" }} />
                <ThemePreviewImage
                  previewUrl={theme.previewImage}
                  name={theme.name}
                  className={styles.themeStripe}
                  fallbackColors={{
                    stripe1: theme.stripe1,
                    stripe2: theme.stripe2,
                    primary: theme.primary,
                  }}
                />
                <div className={styles.themeName}>{theme.name}</div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <button type="submit" className={ui.btnPrimary}>
              Continue to theme content
            </button>
          </div>
        </form>
      ) : (
        <>
          {shareUrl ? (
            <div
              className={ui.card}
              style={{
                marginBottom: 16,
                padding: "16px 20px",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Share with customer</div>
                <div style={{ fontSize: 13, color: "var(--muted-strong)" }}>
                  Send this link so the customer can fill in the invitation details themselves.
                </div>
                <code
                  style={{
                    display: "block",
                    marginTop: 8,
                    fontSize: 12,
                    wordBreak: "break-all",
                    color: "var(--text)",
                  }}
                >
                  {shareUrl}
                </code>
              </div>
              <CopyLinkButton value={shareUrl} />
            </div>
          ) : (
            <div
              className={ui.card}
              style={{
                marginBottom: 16,
                padding: "16px 20px",
                fontSize: 13,
                color: "var(--muted-strong)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>
                Share with customer
              </div>
              {fillLinkError ? (
                <span style={{ color: "#c62828" }}>{fillLinkError}</span>
              ) : (
                <>
                  Share link is not available on this API yet. Deploy the latest{" "}
                  <code>sv-backend-all</code> build, then refresh this page.
                </>
              )}
            </div>
          )}

          {saved ? (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(30,158,90,0.12)",
                color: "#1E9E5A",
                fontSize: 13,
              }}
            >
              Content saved.
            </div>
          ) : null}

          <ThemeContentEditor
            eventId={recordId!}
            fields={themeContentFields}
            raw={contentRaw}
            theme={appliedTheme as VendorThemePreview | null}
            formAction={saveCustomerThemeContentAction}
            backHref={`/vendor/customers/${customerId}`}
            hiddenFields={{
              customerId: customerId!,
              recordKind,
              ...(recordKind === "event"
                ? { eventId: recordId! }
                : { invitationId: recordId! }),
            }}
            title="Theme content"
            submitLabel="Save content"
            description="Fill in details now or share the link above with your customer."
          />
        </>
      )}
    </>
  );
}
