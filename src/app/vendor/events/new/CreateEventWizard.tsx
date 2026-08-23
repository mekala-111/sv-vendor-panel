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
  customerWizardSearchParams,
  draftToLiveEventStep1,
  mergeCustomerDraftForThemeContent,
  normalizeThemeContentRaw,
  parseCustomerWizardQuery,
} from "@/lib/customer-live-event";
import {
  ensureCustomerDraftOnLiveEvent,
  submitEventDetails,
  submitEventPageStep,
  submitThemeContentStep,
  submitThemeStep,
} from "@/lib/event-actions";
import { fetchEvent, fetchInvitation, fetchThemes, fetchVendorProfile, fetchYoutube } from "@/lib/server-data";
import { PreviewEventButton } from "@/components/PreviewEventButton";
import { resolveWizardThemeFields } from "@/lib/theme-config";
import { withResolvedThemeSectionToggles } from "@/lib/theme-section-toggles";
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
  RememberThemeGrid,
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
  const errorMsg = Array.isArray(sp.msg) ? sp.msg[0] : sp.msg;
  const customerQuery = parseCustomerWizardQuery(sp);
  const fromCustomer = Boolean(customerQuery.fromCustomer && kind === "live");
  const customerExtra = customerWizardSearchParams(customerQuery);

  if (fromCustomer && step === 2 && eventId) {
    redirect(wizardStepUrl(kind, 3, eventId, customerExtra));
  }

  if (step > 1 && !eventId) {
    redirect(wizardStepUrl(kind, 1, null, customerExtra));
  }

  const sourceDraftPromise =
    fromCustomer && customerQuery.sourceDraftId && (step === 1 || step === 3) && !eventId
      ? customerQuery.sourceDraftKind === "event"
        ? fetchEvent(customerQuery.sourceDraftId)
        : fetchInvitation(customerQuery.sourceDraftId)
      : fromCustomer && customerQuery.sourceDraftId && step === 3 && eventId
        ? customerQuery.sourceDraftKind === "event"
          ? fetchEvent(customerQuery.sourceDraftId)
          : fetchInvitation(customerQuery.sourceDraftId)
        : Promise.resolve(null);

  let recordPromise: ReturnType<typeof fetchEvent> | ReturnType<typeof fetchInvitation> | Promise<null> =
    eventId
      ? kind === "invitation"
        ? fetchInvitation(eventId)
        : fetchEvent(eventId)
      : Promise.resolve(null);

  if (
    fromCustomer &&
    customerQuery.sourceDraftId &&
    step === 3 &&
    eventId &&
    kind === "live"
  ) {
    recordPromise = ensureCustomerDraftOnLiveEvent(
      eventId,
      customerQuery.sourceDraftId,
      customerQuery.sourceDraftKind ?? "invitation"
    );
  }

  const [themes, record, profile, sourceDraft, youtube] = await Promise.all([
    fetchThemes(),
    recordPromise,
    fetchVendorProfile(),
    sourceDraftPromise,
    kind === "live"
      ? fetchYoutube()
      : Promise.resolve({ channels: [] as { id: string; channelName?: string | null }[] }),
  ]);

  if (step > 1 && eventId && !record) {
    redirect(`${wizardStepUrl(kind, 1, null, customerExtra)}&error=1`);
  }

  const step1Prefill =
    fromCustomer && sourceDraft?.raw
      ? draftToLiveEventStep1(
          sourceDraft.raw as Record<string, unknown>,
          customerQuery.customerId
        )
      : null;

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
  const draftRaw = (sourceDraft?.raw ?? null) as Record<string, unknown> | null;
  const eventRaw = raw as Record<string, unknown>;
  const mergedForContent =
    fromCustomer && draftRaw
      ? mergeCustomerDraftForThemeContent(draftRaw, eventRaw)
      : normalizeThemeContentRaw(eventRaw);

  const selectedThemeId =
    mergedForContent.themeId ||
    (mergedForContent.themeConfig as { themeId?: string } | undefined)?.themeId;
  const selectedTheme = themes.find((t) => t._id === selectedThemeId);
  const themeFields = resolveWizardThemeFields(selectedTheme ?? null, kind);
  const stream = raw.youtubeStreams?.[0];
  const contentRaw = withResolvedThemeSectionToggles({
    ...mergedForContent,
    youtubeLiveUrl: raw.youtubeLiveUrl || stream?.youtubeLiveUrl || "",
    youtubeLiveKey: stream?.youtubeLiveKey || "",
    teaserUrl: raw.teaserUrl ?? "",
  });
  const typeOptions = Array.from(
    new Set([...eventTypeOptions, ...(raw.eventType ? [raw.eventType] : [])])
  );
  const wizardHiddenFields = { wizardKind: kind, ...customerExtra };
  const detailsLabel = kind === "invitation" ? "Invitation name" : "Live event name";
  const themeStep = 2;
  const contentStep = 3;
  const pageStep = kind === "live" ? null : 4;
  const paymentStep = kind === "live" ? 4 : 5;
  const createdStep = kind === "live" ? 5 : null;
  const detailsDefaults = step1Prefill ?? {
    eventName: raw.eventName ?? "",
    eventType: raw.eventType ?? typeOptions[0],
    eventDate: raw.eventDate ? new Date(raw.eventDate).toISOString().slice(0, 10) : "",
    pageTitle: raw.pageTitle ?? "",
    location: raw.location ?? "",
    liveTiming: normalizeTimeForInput(String(raw.liveTiming ?? "")),
    coverImage: raw.coverImage ?? "",
    customerId: raw.customerId ?? customerQuery.customerId ?? "",
  };
  const detailsPlaceholder =
    kind === "invitation" ? "e.g. Rahul & Priya Wedding Invitation" : "e.g. Annual Business Conference";
  const paymentCopy =
    kind === "invitation"
      ? "Complete payment to create and publish your invitation. Failed payments will not publish the invitation."
      : "Complete payment to create and publish your event. Failed payments will not publish the event.";

  return (
    <>
      <h1 className={ui.pageTitle}>{wizardTitle(kind)}</h1>
      <WizardStepper
        current={step}
        eventId={eventId}
        kind={kind}
        fromCustomer={fromCustomer}
        queryExtra={customerExtra}
      />

      {error || errorMsg ? (
        <p
          style={{ color: "#E4362B", fontSize: 13, marginBottom: 14, textAlign: "center" }}
          role="alert"
        >
          {errorMsg ||
            (error === "pay"
              ? "Payment failed or was cancelled. The event was not created. Please try again."
              : "Something went wrong on this step. Please check the fields and try again.")}
        </p>
      ) : null}

      {step === 1 && (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Event Details</div>
          <form action={submitEventDetails}>
            <input type="hidden" name="wizardKind" value={kind} />
            {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
            {fromCustomer ? (
              <>
                <input type="hidden" name="fromCustomer" value="1" />
                {customerQuery.sourceDraftId ? (
                  <input type="hidden" name="sourceDraftId" value={customerQuery.sourceDraftId} />
                ) : null}
                <input
                  type="hidden"
                  name="sourceDraftKind"
                  value={customerQuery.sourceDraftKind ?? "invitation"}
                />
              </>
            ) : null}
            {detailsDefaults.customerId ? (
              <input type="hidden" name="customerId" value={String(detailsDefaults.customerId)} />
            ) : null}
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
                  defaultValue={detailsDefaults.eventName}
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
                  defaultValue={detailsDefaults.eventType ?? typeOptions[0]}
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
                  defaultValue={detailsDefaults.eventDate}
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
                  defaultValue={detailsDefaults.pageTitle}
                />
              </div>

              <div>
                <label className={ui.label}>Cover image</label>
                <CoverImageDropzone defaultValue={detailsDefaults.coverImage ?? ""} />
              </div>

              {kind === "live" ? (
                <>
                  <div>
                    <label className={ui.label} htmlFor="liveTiming">
                      Live event timings
                    </label>
                    <input
                      id="liveTiming"
                      name="liveTiming"
                      type="time"
                      className={ui.input}
                      defaultValue={detailsDefaults.liveTiming}
                    />
                  </div>
                  <div>
                    <label className={ui.label} htmlFor="eventSlug">
                      Domain name
                    </label>
                    <div className={styles.fieldHint}>
                      Ex: raviwedsrani — lowercase letters and numbers, no spaces
                    </div>
                    <DomainSlugInput defaultValue={slug} disabled={Boolean(raw.isPublished)} />
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
                      defaultValue={detailsDefaults.location}
                    />
                  </div>
                </>
              ) : null}
            </div>
            {fromCustomer ? (
              <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16 }}>
                Customer theme is applied automatically. Review and edit theme content on the next
                step.
              </p>
            ) : null}
            <div className={styles.footerRow}>
              <Link
                href={
                  fromCustomer && customerQuery.customerId
                    ? `/vendor/customers/${customerQuery.customerId}?tab=Events`
                    : wizardListPath(kind)
                }
                className={styles.backBtn}
              >
                Cancel
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === themeStep && eventId && !fromCustomer ? (
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
                  <RememberThemeGrid
                    name="themeId"
                    selectedId={raw.themeId}
                    themes={availableThemes.map((t) => ({
                      id: t._id || t.slug,
                      name: t.name,
                      previewImage: t.previewImage,
                      stripe1: t.stripe1,
                      stripe2: t.stripe2,
                      primary: t.primary,
                    }))}
                  />
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
                {fromCustomer
                  ? "Could not load the customer theme. Go back and try again."
                  : `Select a theme in step ${themeStep} before filling theme content.`}
              </p>
              <Link
                href={wizardStepUrl(kind, fromCustomer ? 1 : themeStep, eventId, customerExtra)}
                className={styles.backBtn}
              >
                {fromCustomer ? "Back to event details" : "Back to theme selection"}
              </Link>
            </div>
          ) : (
            <ThemeContentEditor
              eventId={eventId}
              fields={themeFields}
              raw={contentRaw}
              theme={selectedTheme as VendorThemePreview}
              formAction={submitThemeContentStep}
              backHref={wizardStepUrl(kind, fromCustomer ? 1 : themeStep, eventId, customerExtra)}
              hiddenFields={wizardHiddenFields}
              submitLabel="Next"
              kind={kind}
              youtubeChannels={youtube.channels.map((ch) => ({
                id: ch.id,
                channelName: ch.channelName,
              }))}
              description={
                fromCustomer
                  ? `Review content copied from the customer invitation for ${selectedTheme.name}. Add YouTube live details if needed.`
                  : kind === "live"
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
                eventId,
                customerExtra
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
