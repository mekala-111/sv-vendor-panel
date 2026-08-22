import Link from "next/link";
import { redirect } from "next/navigation";
import ui from "@/components/ui.module.css";
import { eventTypeOptions } from "@/lib/data";
import { filterThemesForWizardKind } from "@/lib/event-kind";
import {
  type EventWizardKind,
  creationFeeForKind,
  parseWizardStep,
  wizardListPath,
  wizardStepUrl,
  wizardTitle,
} from "@/lib/event-wizard";
import {
  submitEventDetails,
  submitEventPageStep,
  submitThemeContentStep,
  submitThemeStep,
} from "@/lib/event-actions";
import { fetchEvent, fetchInvitation, fetchThemes, fetchVendorProfile } from "@/lib/server-data";
import { ThemePreviewImage } from "@/components/ThemePreviewImage";
import { PreviewEventButton } from "@/components/PreviewEventButton";
import { resolveWizardThemeFields } from "@/lib/theme-config";
import { ThemeContentEditor } from "@/app/vendor/events/ThemeContentEditor";
import { normalizeTimeForInput } from "@/lib/time-input";
import type { VendorThemePreview } from "@/lib/theme-preview-payload";
import {
  buildPublicEventPathUrl,
  buildPublicInvitationPathUrl,
  getConfiguredPublicEventBase,
} from "@/lib/public-event-url";
import {
  CoverImageDropzone,
  CopyLinkButton,
  DomainSlugInput,
  EventPageQr,
} from "./WizardClient";
import { PaymentStepClient } from "./PaymentStepClient";
import { WizardStepper } from "./WizardStepper";
import styles from "./wizard.module.css";

const PUBLIC_BASE = getConfiguredPublicEventBase();

export async function CreateEventWizard({
  kind,
  searchParams,
}: {
  kind: EventWizardKind;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const step = parseWizardStep(sp.step, kind);
  const eventId = Array.isArray(sp.eventId) ? sp.eventId[0] : sp.eventId;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  if (step > 1 && !eventId) {
    redirect(wizardStepUrl(kind, 1));
  }

  const [themes, record, profile] = await Promise.all([
    fetchThemes(),
    eventId
      ? kind === "invitation"
        ? fetchInvitation(eventId)
        : fetchEvent(eventId)
      : Promise.resolve(null),
    fetchVendorProfile(),
  ]);

  if (step > 1 && eventId && !record) {
    redirect(`${wizardStepUrl(kind, 1)}&error=1`);
  }

  const availableThemes = filterThemesForWizardKind(themes, kind);
  const eventCreationFee = creationFeeForKind(profile, kind);

  const raw = (record?.raw ?? {}) as {
    eventName?: string;
    eventType?: string | null;
    eventDate?: string | null;
    liveTiming?: string | null;
    location?: string | null;
    pageTitle?: string | null;
    coverImage?: string | null;
    customerId?: string | null;
    eventSlug?: string;
    themeId?: string | null;
    scrollMessage?: string | null;
    isPublished?: boolean;
    youtubeLiveUrl?: string | null;
    teaserUrl?: string | null;
    youtubeStreams?: {
      youtubeLiveUrl?: string | null;
      youtubeLiveKey?: string | null;
    }[];
  };

  const slug = raw.eventSlug || "";
  const publicUrl =
    kind === "invitation"
      ? buildPublicInvitationPathUrl(PUBLIC_BASE, slug)
      : buildPublicEventPathUrl(PUBLIC_BASE, slug);
  const displayHost = publicUrl.replace(/^https?:\/\//, "");
  const selectedTheme = themes.find((t) => t._id === raw.themeId);
  const themeFields = resolveWizardThemeFields(selectedTheme ?? null, kind);
  const stream = raw.youtubeStreams?.[0];
  const contentRaw = {
    ...(raw as Record<string, unknown>),
    youtubeLiveUrl: raw.youtubeLiveUrl || stream?.youtubeLiveUrl || "",
    youtubeLiveKey: stream?.youtubeLiveKey || "",
    teaserUrl: raw.teaserUrl ?? "",
  };
  const typeOptions = Array.from(
    new Set([...eventTypeOptions, ...(raw.eventType ? [raw.eventType] : [])])
  );
  const wizardHiddenFields = { wizardKind: kind };
  const detailsLabel = kind === "invitation" ? "Invitation name" : "Live event name";
  const themeStep = 2;
  const contentStep = 3;
  const pageStep = kind === "live" ? null : 4;
  const paymentStep = kind === "live" ? 4 : 5;
  const createdStep = kind === "live" ? 5 : null;
  const detailsPlaceholder =
    kind === "invitation" ? "e.g. Rahul & Priya Wedding Invitation" : "e.g. Annual Business Conference";
  const paymentCopy =
    kind === "invitation"
      ? "Complete payment to create and publish your invitation. Failed payments will not publish the invitation."
      : "Complete payment to create and publish your event. Failed payments will not publish the event.";

  return (
    <>
      <h1 className={ui.pageTitle}>{wizardTitle(kind)}</h1>
      <WizardStepper current={step} eventId={eventId} kind={kind} />

      {error ? (
        <p
          style={{ color: "#E4362B", fontSize: 13, marginBottom: 14, textAlign: "center" }}
          role="alert"
        >
          {error === "pay"
            ? "Payment failed or was cancelled. The event was not created. Please try again."
            : "Something went wrong on this step. Please check the fields and try again."}
        </p>
      ) : null}

      {step === 1 && (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Event Details</div>
          <form action={submitEventDetails}>
            <input type="hidden" name="wizardKind" value={kind} />
            {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
            <div className={styles.formGrid}>
              <div>
                <label className={ui.label} htmlFor="eventName">
                  {detailsLabel}
                </label>
                <input
                  id="eventName"
                  name="eventName"
                  className={ui.input}
                  placeholder={detailsPlaceholder}
                  required
                  minLength={2}
                  defaultValue={raw.eventName ?? ""}
                />
              </div>

              <div>
                <label className={ui.label} htmlFor="eventType">
                  Event type
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  className={ui.input}
                  defaultValue={raw.eventType ?? typeOptions[0]}
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={ui.label} htmlFor="eventDate">
                  Event date
                </label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  className={ui.input}
                  required
                  defaultValue={
                    raw.eventDate ? new Date(raw.eventDate).toISOString().slice(0, 10) : ""
                  }
                />
              </div>

              <div>
                <label className={ui.label} htmlFor="pageTitle">
                  Page title
                </label>
                <input
                  id="pageTitle"
                  name="pageTitle"
                  className={ui.input}
                  placeholder="Rahul Weds Priya"
                  required
                  defaultValue={raw.pageTitle ?? ""}
                />
              </div>

              <div>
                <label className={ui.label}>Cover image</label>
                <CoverImageDropzone defaultValue={raw.coverImage ?? ""} />
              </div>

              {kind === "live" ? (
                <>
                  <div>
                    <label className={ui.label} htmlFor="liveTiming">
                      Live timing
                    </label>
                    <input
                      id="liveTiming"
                      name="liveTiming"
                      type="time"
                      className={ui.input}
                      defaultValue={normalizeTimeForInput(String(raw.liveTiming ?? ""))}
                    />
                  </div>
                  <div>
                    <label className={ui.label} htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      className={ui.input}
                      placeholder="Venue or city"
                      defaultValue={raw.location ?? ""}
                    />
                  </div>
                </>
              ) : null}
            </div>
            <div className={styles.footerRow}>
              <Link href={wizardListPath(kind)} className={styles.backBtn}>
                Cancel
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === themeStep && eventId ? (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>
            {kind === "live" ? "Select Theme" : "Design & Theme"}
          </div>
          <form action={submitThemeStep}>
            <input type="hidden" name="wizardKind" value={kind} />
            <input type="hidden" name="eventId" value={eventId} />
            <div className={styles.formGrid}>
              {availableThemes.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted-strong)" }}>
                  No {kind === "invitation" ? "invitation" : "live event"} themes available yet. You
                  can continue and assign a theme later.
                </p>
              ) : (
                <div>
                  <div className={ui.label} style={{ marginBottom: 10 }}>
                    Design
                  </div>
                  <div className={styles.themeGrid}>
                    {availableThemes.map((t) => {
                      const id = t._id || t.slug;
                      const checked = raw.themeId === id;
                      return (
                        <label
                          key={id}
                          className={`${styles.themeCard} ${checked ? styles.themeCardActive : ""}`}
                        >
                          <input
                            type="radio"
                            name="themeId"
                            value={id}
                            defaultChecked={checked}
                            style={{ display: "none" }}
                          />
                          <ThemePreviewImage
                            previewUrl={t.previewImage}
                            name={t.name}
                            className={styles.themeStripe}
                            fallbackColors={{
                              stripe1: t.stripe1,
                              stripe2: t.stripe2,
                              primary: t.primary,
                            }}
                          />
                          <div className={styles.themeName}>{t.name}</div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {publicUrl && eventId ? (
                <div>
                  <div className={ui.label}>Watch preview of design</div>
                  <PreviewEventButton eventId={eventId} kind={kind} />
                </div>
              ) : (
                <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {kind === "live"
                    ? "Preview link appears after you set the public page slug on the event Event Page tab."
                    : "Preview link appears after you set the domain slug in Event Page."}
                </p>
              )}
            </div>
            <div className={styles.footerRow}>
              <Link href={wizardStepUrl(kind, 1, eventId)} className={styles.backBtn}>
                Back
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {step === contentStep && eventId ? (
        <>
          {!selectedTheme ? (
            <div className={styles.panel}>
              <div className={styles.stepTitle}>Theme Content</div>
              <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16 }}>
                Select a theme in step {themeStep} before filling theme content.
              </p>
              <Link href={wizardStepUrl(kind, themeStep, eventId)} className={styles.backBtn}>
                Back to theme selection
              </Link>
            </div>
          ) : (
            <ThemeContentEditor
              eventId={eventId}
              fields={themeFields}
              raw={contentRaw}
              theme={selectedTheme as VendorThemePreview}
              formAction={submitThemeContentStep}
              backHref={wizardStepUrl(kind, themeStep, eventId)}
              hiddenFields={wizardHiddenFields}
              submitLabel="Next"
              description={
                kind === "live"
                  ? `Page content and YouTube live details for ${selectedTheme.name}.`
                  : `Content for ${selectedTheme.name} — couple photos, schedule, invitation, and gallery.`
              }
            />
          )}
        </>
      ) : null}

      {pageStep && step === pageStep && eventId ? (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Event Page</div>
          <form action={submitEventPageStep}>
            <input type="hidden" name="wizardKind" value={kind} />
            <input type="hidden" name="eventId" value={eventId} />
            <div className={styles.formGrid}>
              <div>
                <label className={ui.label} htmlFor="eventSlug">
                  Domain name
                </label>
                <div className={styles.fieldHint}>
                  Ex: ravi-weds-rani — lowercase letters, numbers, and hyphens
                </div>
                <DomainSlugInput defaultValue={slug} disabled={Boolean(raw.isPublished)} />
                {slug ? <EventPageQr slug={slug} isPublished={Boolean(raw.isPublished)} /> : null}
              </div>
            </div>
            <div className={styles.footerRow}>
              <Link href={wizardStepUrl(kind, contentStep, eventId)} className={styles.backBtn}>
                Back
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {step === paymentStep && eventId ? (
        <div className={`${styles.panel} ${styles.publishCard}`}>
          <div className={styles.stepTitle} style={{ textAlign: "center" }}>
            Payment
          </div>
          <div className={styles.publishSummary}>
            <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 12 }}>
              {paymentCopy}
            </p>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              {raw.eventName || "Untitled event"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted-strong)", marginBottom: 4 }}>
              Theme: {selectedTheme?.name ?? "Not selected"}
            </div>
            {displayHost ? (
              <div style={{ fontSize: 12, color: "var(--muted-strong)", marginTop: 8 }}>
                {displayHost}
              </div>
            ) : null}
          </div>
          <PaymentStepClient
            eventId={eventId}
            eventName={raw.eventName || "Event"}
            fee={eventCreationFee}
            wizardKind={kind}
          />
          <div className={styles.footerRow} style={{ marginTop: 18 }}>
            <Link
              href={wizardStepUrl(
                kind,
                kind === "live" ? contentStep : (pageStep ?? contentStep),
                eventId
              )}
              className={styles.backBtn}
            >
              Back
            </Link>
            <span />
          </div>
        </div>
      ) : null}

      {createdStep && step === createdStep && eventId ? (
        <div className={`${styles.panel} ${styles.publishCard}`} style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#E8F8EF",
              color: "#1B7A3D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              margin: "0 auto 16px",
            }}
          >
            ✓
          </div>
          <div className={styles.stepTitle}>Live Event Created</div>
          <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 18 }}>
            {raw.isPublished
              ? "Your live event is published. Share the link with guests or open the event dashboard."
              : "Your event was saved. Complete payment approval to go live."}
          </p>
          {displayHost ? (
            <div className={styles.publishSummary}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {raw.eventName || "Live event"}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted-strong)", wordBreak: "break-all" }}>
                {publicUrl}
              </div>
              {slug ? (
                <div style={{ marginTop: 14 }}>
                  <EventPageQr slug={slug} isPublished={Boolean(raw.isPublished)} />
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                {publicUrl ? <CopyLinkButton value={publicUrl} /> : null}
                {raw.isPublished && publicUrl ? (
                  <a className={ui.btnDark} href={publicUrl} target="_blank" rel="noreferrer">
                    Open live event
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            <Link href={`/vendor/events/${eventId}`} className={ui.btnDark} style={{ textDecoration: "none" }}>
              Go to event dashboard
            </Link>
            <Link href={wizardListPath(kind)} className={styles.backBtn}>
              All live events
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
