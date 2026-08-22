import Link from "next/link";
import { redirect } from "next/navigation";
import ui from "@/components/ui.module.css";
import { eventTypeOptions } from "@/lib/data";
import {
  submitEventDetails,
  submitEventPageStep,
  submitThemeContentStep,
  submitThemeStep,
  submitYoutubeStep,
} from "@/lib/event-actions";
import { fetchCustomers, fetchEvent, fetchThemes, fetchVendorProfile, fetchYoutube } from "@/lib/server-data";
import {
  CoverImageDropzone,
  DomainSlugInput,
  EventPageQr,
  GalleryImagesField,
  ImageFileField,
  RevealStreamKey,
  SubEventsField,
} from "./WizardClient";
import { PaymentStepClient } from "./PaymentStepClient";
import { WizardStepper } from "./WizardStepper";
import {
  buildPublicEventPathUrl,
  getConfiguredPublicEventBase,
} from "@/lib/public-event-url";
import styles from "./wizard.module.css";

const PUBLIC_BASE = getConfiguredPublicEventBase();

function parseStep(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value ?? 1);
  if (!Number.isFinite(n) || n < 1 || n > 6) return 1;
  return n;
}

export default async function CreateEventPage(props: PageProps<"/vendor/events/new">) {
  const searchParams = await props.searchParams;
  const step = parseStep(searchParams.step);
  const eventId = Array.isArray(searchParams.eventId)
    ? searchParams.eventId[0]
    : searchParams.eventId;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  if (step > 1 && !eventId) {
    redirect("/vendor/events/new?step=1");
  }

  const [customers, themes, youtube, event, profile] = await Promise.all([
    fetchCustomers(),
    fetchThemes(),
    fetchYoutube(),
    eventId ? fetchEvent(eventId) : Promise.resolve(null),
    fetchVendorProfile(),
  ]);

  if (step > 1 && eventId && !event) {
    redirect("/vendor/events/new?step=1&error=1");
  }

  const eventCreationFee = Number(profile?.eventCreationFee ?? 0);

  const raw = (event?.raw ?? {}) as {
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
    youtubeChannelId?: string | null;
    youtubeLiveUrl?: string | null;
    youtubeVideoId?: string | null;
    teaserUrl?: string | null;
    scrollMessage?: string | null;
    galleryImages?: string[];
    logoImage?: string | null;
    customImage?: string | null;
    whatsappImage?: string | null;
    brideName?: string | null;
    groomName?: string | null;
    brideImage?: string | null;
    groomImage?: string | null;
    eventTime?: string | null;
    eventPlace?: string | null;
    invitationCard?: string | null;
    subEvents?: { title?: string; date?: string | null; time?: string | null; place?: string | null }[];
    showWatchLive?: boolean;
    showSocialShare?: boolean;
    remarks1?: string | null;
    remarks2?: string | null;
    fontFamily?: string | null;
    fontColor?: string | null;
    accessPin?: string | null;
    whatsappNumber?: string | null;
    isPublished?: boolean;
  };

  const slug = raw.eventSlug || "";
  const publicUrl = buildPublicEventPathUrl(PUBLIC_BASE, slug);
  const displayHost = publicUrl.replace(/^https?:\/\//, "");
  const selectedTheme = themes.find((t) => t._id === raw.themeId);
  const connectedChannels = youtube.channels.filter((c) => c.status === "CONNECTED");
  const typeOptions = Array.from(
    new Set([...eventTypeOptions, ...(raw.eventType ? [raw.eventType] : [])])
  );
  const teaserDefault =
    raw.teaserUrl || (raw.youtubeVideoId ? `https://youtu.be/${raw.youtubeVideoId}` : "");

  return (
    <>
      <h1 className={ui.pageTitle}>Create Event</h1>
      <WizardStepper current={step} eventId={eventId} />

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
            {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
            <div className={styles.formGrid}>
              <div>
                <div className={ui.label}>Selected service</div>
                <div className={styles.servicePill}>
                  <input type="radio" checked readOnly aria-label="YouTube" />
                  YouTube
                </div>
              </div>

              <div>
                <label className={ui.label} htmlFor="eventName">
                  Event name
                </label>
                <input
                  id="eventName"
                  name="eventName"
                  className={ui.input}
                  placeholder="e.g. Rahul & Priya Wedding"
                  required
                  minLength={2}
                  defaultValue={raw.eventName ?? ""}
                />
              </div>

              <div className={ui.grid2}>
                <div>
                  <label className={ui.label} htmlFor="customerId">
                    Customer
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    className={ui.input}
                    defaultValue={raw.customerId ?? ""}
                  >
                    <option value="">— Select customer —</option>
                    {customers.map((c) => (
                      <option key={c._id ?? c.id} value={c._id ?? ""}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
              </div>

              <div className={ui.grid2}>
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
                  <label className={ui.label} htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    className={ui.input}
                    placeholder="City, Venue"
                    defaultValue={raw.location ?? ""}
                  />
                </div>
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
                <label className={ui.label} htmlFor="liveTiming">
                  Live event timings
                </label>
                <input
                  id="liveTiming"
                  name="liveTiming"
                  className={ui.input}
                  placeholder="Live Starts on 20 Aug, 2026 from 6:00 PM IST Onwards"
                  defaultValue={raw.liveTiming ?? ""}
                />
              </div>

              <div>
                <label className={ui.label}>Cover image</label>
                <CoverImageDropzone defaultValue={raw.coverImage ?? ""} />
              </div>
            </div>
            <div className={styles.footerRow}>
              <Link href="/vendor/events" className={styles.backBtn}>
                Cancel
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && eventId && (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>YouTube Streaming</div>
          <form action={submitYoutubeStep}>
            <input type="hidden" name="eventId" value={eventId} />
            <div className={styles.formGrid}>
              <div>
                <label className={ui.label} htmlFor="youtubeChannelId">
                  Channel
                </label>
                <select
                  id="youtubeChannelId"
                  name="youtubeChannelId"
                  className={ui.input}
                  defaultValue={raw.youtubeChannelId ?? ""}
                >
                  <option value="">— Select channel (optional) —</option>
                  {connectedChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.channelName || c.id}
                    </option>
                  ))}
                </select>
                {connectedChannels.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--muted-strong)", marginTop: 8 }}>
                    No connected channels yet.{" "}
                    <Link href="/vendor/youtube" style={{ color: "var(--accent)", fontWeight: 700 }}>
                      Connect YouTube
                    </Link>{" "}
                    or enter a live URL / key below.
                  </p>
                ) : null}
              </div>
              <div>
                <label className={ui.label} htmlFor="youtubeLiveUrl">
                  YouTube live URL
                </label>
                <div className={styles.fieldHint}>Ex: https://youtube.com/live/_eZppUQh9kU</div>
                <input
                  id="youtubeLiveUrl"
                  name="youtubeLiveUrl"
                  className={ui.input}
                  placeholder="https://youtube.com/live/xxxxx"
                  defaultValue={raw.youtubeLiveUrl ?? ""}
                />
              </div>
              <div>
                <label className={ui.label} htmlFor="youtubeLiveKey">
                  YouTube live key
                </label>
                <div className={styles.fieldHint}>Ex: rt56-t6dt-1kga-kc8a-bkf7</div>
                <RevealStreamKey name="youtubeLiveKey" />
              </div>
              <div>
                <label className={ui.label} htmlFor="teaserVideo">
                  Teaser URL
                </label>
                <div className={styles.fieldHint}>Ex: https://youtu.be/LsVQ3F3LCcE</div>
                <input
                  id="teaserVideo"
                  name="teaserVideo"
                  className={ui.input}
                  placeholder="https://youtu.be/xxxxx"
                  defaultValue={teaserDefault}
                />
              </div>
              <div>
                <label className={ui.label} htmlFor="scrollMessage">
                  Scroll message
                </label>
                <input
                  id="scrollMessage"
                  name="scrollMessage"
                  className={ui.input}
                  placeholder="Welcome message scrolling on the event page"
                  defaultValue={raw.scrollMessage ?? ""}
                />
              </div>
            </div>
            <div className={styles.footerRow}>
              <Link
                href={`/vendor/events/new?step=1&eventId=${encodeURIComponent(eventId)}`}
                className={styles.backBtn}
              >
                Back
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && eventId && (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Design &amp; Theme</div>
          <form action={submitThemeStep}>
            <input type="hidden" name="eventId" value={eventId} />
            <div className={styles.formGrid}>
              {themes.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted-strong)" }}>
                  No themes available yet. You can continue and assign a theme later.
                </p>
              ) : (
                <div>
                  <div className={ui.label} style={{ marginBottom: 10 }}>
                    Design
                  </div>
                  <div className={styles.themeGrid}>
                    {themes.map((t) => {
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
                          <div
                            className={styles.themeStripe}
                            style={{
                              background: `repeating-linear-gradient(45deg, ${t.stripe1}, ${t.stripe1} 8px, ${t.stripe2} 8px, ${t.stripe2} 16px)`,
                            }}
                          />
                          <div className={styles.themeName}>{t.name}</div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {publicUrl ? (
                <div>
                  <div className={ui.label}>Watch preview of design</div>
                  <a className={styles.previewLink} href={publicUrl} target="_blank" rel="noreferrer">
                    Preview event page
                  </a>
                </div>
              ) : (
                <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  Preview link appears after you set the domain slug in Event Page.
                </p>
              )}
            </div>
            <div className={styles.footerRow}>
              <Link
                href={`/vendor/events/new?step=2&eventId=${encodeURIComponent(eventId)}`}
                className={styles.backBtn}
              >
                Back
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 4 && eventId && (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Theme Content</div>
          <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 16 }}>
            Content for {selectedTheme?.name ?? "your selected theme"} — couple photos, schedule,
            invitation, and gallery.
          </p>
          <form action={submitThemeContentStep}>
            <input type="hidden" name="eventId" value={eventId} />
            <div className={styles.formGrid}>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label} htmlFor="brideName">
                    Bride name
                  </label>
                  <input
                    id="brideName"
                    name="brideName"
                    className={ui.input}
                    placeholder="Priya"
                    defaultValue={raw.brideName ?? ""}
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="groomName">
                    Groom name
                  </label>
                  <input
                    id="groomName"
                    name="groomName"
                    className={ui.input}
                    placeholder="Rahul"
                    defaultValue={raw.groomName ?? ""}
                  />
                </div>
              </div>

              <div className={ui.grid2}>
                <ImageFileField
                  name="brideImage"
                  label="Bride image"
                  hint="Max 2MB"
                  maxBytes={2 * 1024 * 1024}
                  defaultValue={raw.brideImage ?? ""}
                />
                <ImageFileField
                  name="groomImage"
                  label="Groom image"
                  hint="Max 2MB"
                  maxBytes={2 * 1024 * 1024}
                  defaultValue={raw.groomImage ?? ""}
                />
              </div>

              <div className={ui.grid2}>
                <div>
                  <label className={ui.label} htmlFor="themeEventDate">
                    Event date
                  </label>
                  <input
                    id="themeEventDate"
                    name="eventDate"
                    type="date"
                    className={ui.input}
                    defaultValue={
                      raw.eventDate ? new Date(raw.eventDate).toISOString().slice(0, 10) : ""
                    }
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="eventTime">
                    Event time
                  </label>
                  <input
                    id="eventTime"
                    name="eventTime"
                    className={ui.input}
                    placeholder="6:00 PM IST"
                    defaultValue={raw.eventTime ?? ""}
                  />
                </div>
              </div>

              <div>
                <label className={ui.label} htmlFor="eventPlace">
                  Event place
                </label>
                <input
                  id="eventPlace"
                  name="eventPlace"
                  className={ui.input}
                  placeholder="Venue name, city"
                  defaultValue={raw.eventPlace ?? raw.location ?? ""}
                />
              </div>

              <SubEventsField defaultValue={raw.subEvents ?? []} />

              <ImageFileField
                name="invitationCard"
                label="Invitation card"
                hint="Full invitation image · max 4MB"
                maxBytes={4 * 1024 * 1024}
                defaultValue={raw.invitationCard ?? ""}
              />

              <GalleryImagesField defaultValue={raw.galleryImages ?? []} max={20} />
            </div>
            <div className={styles.footerRow}>
              <Link
                href={`/vendor/events/new?step=3&eventId=${encodeURIComponent(eventId)}`}
                className={styles.backBtn}
              >
                Back
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 5 && eventId && (
        <div className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.stepTitle}>Event Page</div>
          <form action={submitEventPageStep}>
            <input type="hidden" name="eventId" value={eventId} />
            <div className={styles.formGrid}>
              <div>
                <label className={ui.label} htmlFor="eventSlug">
                  Domain name
                </label>
                <div className={styles.fieldHint}>
                  Ex: raviwedsrani — all small letters, no spaces
                </div>
                <DomainSlugInput defaultValue={slug} disabled={Boolean(raw.isPublished)} />
                {slug ? <EventPageQr slug={slug} isPublished={Boolean(raw.isPublished)} /> : null}
              </div>
            </div>
            <div className={styles.footerRow}>
              <Link
                href={`/vendor/events/new?step=4&eventId=${encodeURIComponent(eventId)}`}
                className={styles.backBtn}
              >
                Back
              </Link>
              <button type="submit" className={ui.btnDark}>
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 6 && eventId && (
        <div className={`${styles.panel} ${styles.publishCard}`}>
          <div className={styles.stepTitle} style={{ textAlign: "center" }}>
            Payment
          </div>
          <div className={styles.publishSummary}>
            <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 12 }}>
              Complete payment to create and publish your event. Failed payments will not publish
              the event.
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
          />
          <div className={styles.footerRow} style={{ marginTop: 18 }}>
            <Link
              href={`/vendor/events/new?step=5&eventId=${encodeURIComponent(eventId)}`}
              className={styles.backBtn}
            >
              Back
            </Link>
            <span />
          </div>
        </div>
      )}
    </>
  );
}
