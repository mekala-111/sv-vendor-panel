import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { eventDetailTabs, type EventDetailTab } from "@/lib/data";
import {
  saveEventPageAction,
  saveThemeContentAction,
} from "@/lib/event-detail-actions";
import { ThemeContentEditor } from "@/app/vendor/events/ThemeContentEditor";
import type { VendorThemePreview } from "@/lib/theme-preview-payload";
import { resolveWizardThemeFields } from "@/lib/theme-config";
import { withResolvedThemeSectionToggles } from "@/lib/theme-section-toggles";
import { normalizeThemeContentRaw } from "@/lib/customer-live-event";
import { fetchEvent, fetchEventCreationPayment, fetchThemes } from "@/lib/server-data";
import {
  buildPublicEventPathUrl,
  getConfiguredPublicEventBase,
} from "@/lib/public-event-url";
import { PreviewEventButton } from "@/components/PreviewEventButton";
import { EventQuickActions } from "./EventActions";
import styles from "@/app/vendor/events/new/wizard.module.css";

const PUBLIC_BASE = getConfiguredPublicEventBase();

function publicEventUrl(slug?: string | null) {
  return buildPublicEventPathUrl(PUBLIC_BASE, slug || "");
}

function tabBanner(saved?: string, error?: string) {
  if (saved) {
    return (
      <div style={{ marginBottom: 14, fontSize: 13, color: "#1E9E5A", fontWeight: 700 }}>
        Saved successfully.
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ marginBottom: 14, fontSize: 13, color: "#E4362B", fontWeight: 700 }}>
        Could not save. Please try again.
      </div>
    );
  }
  return null;
}

export default async function EventDetailPage(props: PageProps<"/vendor/events/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const selected = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const saved = Array.isArray(searchParams.saved) ? searchParams.saved[0] : searchParams.saved;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  const event = await fetchEvent(id);
  if (!event) notFound();

  const eventId = event._id ?? id;
  const raw = event.raw;
  const activeTab = (eventDetailTabs as readonly string[]).includes(selected ?? "")
    ? (selected as EventDetailTab)
    : "Overview";

  const publicUrl = publicEventUrl(raw.eventSlug);
  const isLive = Boolean(raw.isPublished);
  const [themes, feePayment] = await Promise.all([
    activeTab === "Theme Content" || activeTab === "Overview" ? fetchThemes() : Promise.resolve([]),
    fetchEventCreationPayment(eventId),
  ]);

  const streams = raw.youtubeStreams ?? [];
  const stream = streams[0];
  const contentRaw = withResolvedThemeSectionToggles({
    ...normalizeThemeContentRaw(raw as Record<string, unknown>),
    youtubeLiveUrl: raw.youtubeLiveUrl || stream?.youtubeLiveUrl || "",
    youtubeLiveKey: stream?.youtubeLiveKey || "",
    teaserUrl: raw.teaserUrl ?? "",
  });
  const access = raw.access;
  const themeConfig = raw.themeConfig;
  const currentThemeId = themeConfig?.themeId || raw.themeId;
  const appliedTheme = themes.find((t) => t._id === currentThemeId);
  const themeContentFields = resolveWizardThemeFields(appliedTheme ?? null, "live");
  const paymentRejected = feePayment?.status === "FAILED";
  const paymentPending = feePayment?.status === "PENDING";
  const paymentSuccess = feePayment?.status === "SUCCESS";

  return (
    <>
      <Link href="/vendor/events" className={ui.backLink}>
        &larr; Back to Events
      </Link>
      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{event.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {event.date}, {event.time} · {event.location}
          </div>
        </div>
        <div className={ui.row} style={{ justifyContent: "flex-end" }}>
          <Badge label={event.status} size="lg" />
          {isLive && publicUrl ? (
            <a
              className={ui.btnDanger}
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              OPEN LIVE EVENT
            </a>
          ) : paymentRejected ? (
            <Link
              className={ui.btnDanger}
              href={`/vendor/events/new?step=4&eventId=${encodeURIComponent(eventId)}`}
              style={{ textDecoration: "none" }}
            >
              RESUBMIT PAYMENT
            </Link>
          ) : paymentPending ? (
            <span
              className={ui.btnOutlineSm}
              style={{ opacity: 0.85, cursor: "default" }}
            >
              AWAITING PAYMENT APPROVAL
            </span>
          ) : (
            <Link
              className={ui.btnDanger}
              href={`/vendor/events/new?step=4&eventId=${encodeURIComponent(eventId)}`}
              style={{ textDecoration: "none" }}
            >
              COMPLETE PAYMENT
            </Link>
          )}
        </div>
      </div>

      {paymentRejected ? (
        <div
          className={ui.card}
          style={{
            marginBottom: 16,
            borderColor: "#F5C2C0",
            background: "#FDEAEA",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#E4362B", marginBottom: 6 }}>
            Payment rejected
          </div>
          <div style={{ fontSize: 13, color: "#7A2E2A" }}>
            {feePayment?.rejectionReason || "Admin rejected this payment. The event is not live."}
          </div>
          {feePayment?.utrNumber ? (
            <div style={{ fontSize: 12, color: "#9A5B57", marginTop: 8, fontFamily: "monospace" }}>
              UTR: {feePayment.utrNumber}
            </div>
          ) : null}
        </div>
      ) : null}

      {paymentPending ? (
        <div
          className={ui.card}
          style={{
            marginBottom: 16,
            borderColor: "#F0D9A8",
            background: "#FFF8EB",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#B7791F", marginBottom: 6 }}>
            Payment pending approval
          </div>
          <div style={{ fontSize: 13, color: "#7A5C20" }}>
            Your payment is under review. The live event opens only after admin verifies and
            publishes it.
          </div>
          {feePayment?.utrNumber ? (
            <div style={{ fontSize: 12, color: "#9A7B40", marginTop: 8, fontFamily: "monospace" }}>
              UTR: {feePayment.utrNumber}
            </div>
          ) : null}
        </div>
      ) : null}

      {paymentSuccess && isLive ? (
        <div
          className={ui.card}
          style={{
            marginBottom: 16,
            borderColor: "#B7E4C7",
            background: "#E8F8EF",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1B7A3D", marginBottom: 4 }}>
            Payment verified · Event live
          </div>
          <div style={{ fontSize: 13, color: "#2F6B45" }}>
            Admin approved your payment. Guests can open the public event page.
          </div>
        </div>
      ) : null}

      <EventQuickActions
        eventSlug={raw.eventSlug}
        eventName={raw.pageTitle || raw.eventName || event.name}
        coverImage={raw.coverImage}
        invitationCard={(raw as { invitationCard?: string | null }).invitationCard}
        whatsappImage={(raw as { whatsappImage?: string | null }).whatsappImage}
        isLive={isLive}
      />

      <LinkTabs
        active={activeTab}
        size="sm"
        items={eventDetailTabs.map((t) => ({ label: t, href: `/vendor/events/${eventId}?tab=${encodeURIComponent(t)}` }))}
      />

      <div className={ui.card}>
        {tabBanner(saved, error)}

        {activeTab === "Overview" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 12 }}>
              Event overview
            </div>
            <div className={ui.grid2} style={{ marginBottom: 16 }}>
              <div>
                <div className={ui.label}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{event.status}</div>
              </div>
              <div>
                <div className={ui.label}>Published</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.isPublished ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className={ui.label}>Payment</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {paymentSuccess
                    ? "Verified"
                    : paymentPending
                      ? "Pending approval"
                      : paymentRejected
                        ? "Rejected"
                        : "Not submitted"}
                </div>
              </div>
              <div>
                <div className={ui.label}>Type</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.eventType || "—"}</div>
              </div>
              <div>
                <div className={ui.label}>Live timing</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.liveTiming || "—"}</div>
              </div>
              <div>
                <div className={ui.label}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{event.customer}</div>
              </div>
              <div>
                <div className={ui.label}>Event code</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.eventCode || "—"}</div>
              </div>
            </div>
            {paymentRejected ? (
              <div style={{ marginBottom: 16, fontSize: 13.5, color: "#E4362B", fontWeight: 600 }}>
                Rejection reason: {feePayment?.rejectionReason || "Payment was rejected by admin."}
              </div>
            ) : null}
            {raw.description ? (
              <p style={{ fontSize: 13.5, color: "var(--muted-strong)", marginBottom: 16 }}>{raw.description}</p>
            ) : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!isLive ? (
                <Link
                  className={ui.btnOutlineSm}
                  href={`/vendor/events/new?step=4&eventId=${encodeURIComponent(eventId)}`}
                  style={{ textDecoration: "none" }}
                >
                  Complete setup
                </Link>
              ) : null}
              {isLive && publicUrl ? (
                <a className={ui.btnOutlineSm} href={publicUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  Open live event
                </a>
              ) : null}
            </div>
            <div style={{ marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
              Theme: {appliedTheme?.name || (currentThemeId ? "Assigned" : "Not set")} · YouTube streams:{" "}
              {streams.length} · Access: {access?.accessType || (raw.isPublic === false ? "PRIVATE" : "PUBLIC")}
            </div>
          </div>
        ) : null}

        {activeTab === "Theme Content" ? (
          <div className={styles.themeContentTab}>
            {!currentThemeId ? (
              <>
                <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
                  Theme content
                </div>
                <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 12 }}>
                  Select a theme during event setup before editing content.
                </p>
                <Link
                  className={ui.btnOutlineSm}
                  href={`/vendor/events/new?step=2&eventId=${encodeURIComponent(eventId)}`}
                  style={{ textDecoration: "none" }}
                >
                  Select theme
                </Link>
              </>
            ) : (
              <ThemeContentEditor
                eventId={eventId}
                fields={themeContentFields}
                raw={contentRaw}
                theme={appliedTheme as VendorThemePreview | null}
                formAction={saveThemeContentAction}
                title="Theme content"
                submitLabel="Save content"
                description={`Page content and YouTube live details for ${appliedTheme?.name ?? "your theme"}.`}
                banner={tabBanner(saved, error)}
              />
            )}
          </div>
        ) : null}

        {activeTab === "Payment" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Payment
            </div>
            <div className={ui.grid2} style={{ marginBottom: 16 }}>
              <div>
                <div className={ui.label}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {paymentSuccess
                    ? "Verified"
                    : paymentPending
                      ? "Pending approval"
                      : paymentRejected
                        ? "Rejected"
                        : "Not submitted"}
                </div>
              </div>
              {feePayment?.amount != null ? (
                <div>
                  <div className={ui.label}>Amount</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    ₹{Number(feePayment.amount).toLocaleString("en-IN")}
                  </div>
                </div>
              ) : null}
              {feePayment?.utrNumber ? (
                <div>
                  <div className={ui.label}>UTR</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                    {feePayment.utrNumber}
                  </div>
                </div>
              ) : null}
            </div>
            {paymentRejected ? (
              <p style={{ fontSize: 13.5, color: "#E4362B", marginBottom: 14 }}>
                {feePayment?.rejectionReason || "Payment was rejected. Resubmit to publish the event."}
              </p>
            ) : null}
            {!isLive ? (
              <Link
                className={ui.btnPrimary}
                href={`/vendor/events/new?step=4&eventId=${encodeURIComponent(eventId)}`}
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                {paymentRejected ? "Resubmit payment" : "Complete payment"}
              </Link>
            ) : (
              <p style={{ fontSize: 13.5, color: "var(--muted-strong)" }}>
                Payment verified. This live event is published.
              </p>
            )}
          </div>
        ) : null}

        {activeTab === "Event Page" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Public event page
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted-strong)", marginBottom: 16 }}>
              Control the slug and title used on the live page.
            </p>
            <form action={saveEventPageAction} style={{ display: "grid", gap: 14, maxWidth: 480 }}>
              <input type="hidden" name="eventId" value={eventId} />
              <div>
                <label className={ui.label} htmlFor="eventSlug">
                  Public slug
                </label>
                <input
                  className={ui.inputMono}
                  id="eventSlug"
                  name="eventSlug"
                  defaultValue={raw.eventSlug || ""}
                  disabled={Boolean(raw.isPublished)}
                />
                {raw.isPublished ? (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    Slug is locked after publish.
                  </div>
                ) : null}
              </div>
              <div>
                <label className={ui.label} htmlFor="pageTitle">
                  Page title
                </label>
                <input
                  className={ui.input}
                  id="pageTitle"
                  name="pageTitle"
                  defaultValue={raw.pageTitle || raw.eventName || ""}
                />
              </div>
              {isLive && publicUrl ? (
                <div style={{ fontSize: 13 }}>
                  Live URL:{" "}
                  <a href={publicUrl} target="_blank" rel="noreferrer" className={ui.link}>
                    {publicUrl}
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  Live URL unlocks after payment is verified and the event is published.
                </div>
              )}
              {!isLive && raw.eventSlug ? (
                <PreviewEventButton eventId={eventId} />
              ) : null}
              <button type="submit" className={ui.btnPrimary} style={{ justifySelf: "start" }}>
                Save page settings
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
