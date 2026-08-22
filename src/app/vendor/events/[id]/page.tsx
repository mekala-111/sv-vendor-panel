import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { eventDetailTabs, type EventDetailTab } from "@/lib/data";
import {
  assignEventThemeAction,
  saveEventAccessAction,
  saveEventPageAction,
} from "@/lib/event-detail-actions";
import { fetchEvent, fetchEventCreationPayment, fetchEventRecording, fetchThemes, fetchYoutube } from "@/lib/server-data";
import {
  buildPublicEventPathUrl,
  getConfiguredPublicEventBase,
} from "@/lib/public-event-url";
import { EventQuickActions } from "./EventActions";

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
  const [themes, youtube, recording, feePayment] = await Promise.all([
    activeTab === "Theme" || activeTab === "Overview" ? fetchThemes() : Promise.resolve([]),
    activeTab === "YouTube" || activeTab === "Overview" ? fetchYoutube() : Promise.resolve(null),
    activeTab === "Recording" ? fetchEventRecording(eventId) : Promise.resolve(null),
    fetchEventCreationPayment(eventId),
  ]);

  const streams = raw.youtubeStreams ?? [];
  const access = raw.access;
  const themeConfig = raw.themeConfig;
  const currentThemeId = themeConfig?.themeId || raw.themeId;
  const appliedTheme = themes.find((t) => t._id === currentThemeId);
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
              href={`/vendor/events/new?step=6&eventId=${encodeURIComponent(eventId)}`}
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
              href={`/vendor/events/new?step=6&eventId=${encodeURIComponent(eventId)}`}
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

      <EventQuickActions eventSlug={raw.eventSlug} eventId={eventId} isLive={isLive} />

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
              <Link
                className={ui.btnOutlineSm}
                href={`/vendor/events/new?step=1&eventId=${encodeURIComponent(eventId)}`}
                style={{ textDecoration: "none" }}
              >
                Continue setup
              </Link>
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

        {activeTab === "YouTube" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              YouTube for this event
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted-strong)", marginBottom: 16 }}>
              Stream keys and live URLs linked to this event.
            </p>
            {streams.length === 0 ? (
              <div>
                <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 12 }}>
                  No YouTube stream configured yet.
                </p>
                <Link
                  className={ui.btnPrimary}
                  href={`/vendor/events/new?step=2&eventId=${encodeURIComponent(eventId)}`}
                  style={{ textDecoration: "none" }}
                >
                  Configure YouTube
                </Link>
                {youtube && youtube.channels.length > 0 ? (
                  <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>
                    {youtube.channels.length} channel(s) available in your account.
                  </p>
                ) : null}
              </div>
            ) : (
              <div>
                {streams.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      borderTop: "1px solid var(--border-soft)",
                      padding: "12px 0",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Status: {s.status || "—"}</div>
                    {s.youtubeLiveUrl ? (
                      <div style={{ fontSize: 13 }}>
                        Live URL:{" "}
                        <a href={s.youtubeLiveUrl} target="_blank" rel="noreferrer" className={ui.link}>
                          {s.youtubeLiveUrl}
                        </a>
                      </div>
                    ) : null}
                    {s.youtubeVideoId ? (
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>Video ID: {s.youtubeVideoId}</div>
                    ) : null}
                    {s.youtubeLiveKey ? (
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        Stream key: <code>{s.youtubeLiveKey.slice(0, 6)}••••</code>
                      </div>
                    ) : null}
                  </div>
                ))}
                <Link
                  className={ui.btnOutlineSm}
                  href={`/vendor/events/new?step=2&eventId=${encodeURIComponent(eventId)}`}
                  style={{ textDecoration: "none", marginTop: 12, display: "inline-block" }}
                >
                  Edit YouTube setup
                </Link>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "Theme" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Event theme
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted-strong)", marginBottom: 16 }}>
              Choose a theme for the public event page.
            </p>
            {themes.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>No themes available yet.</p>
            ) : (
              <form action={assignEventThemeAction}>
                <input type="hidden" name="eventId" value={eventId} />
                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                  {themes.map((t) => (
                    <label
                      key={t._id}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="themeId"
                        value={t._id}
                        defaultChecked={t._id === currentThemeId}
                        required
                      />
                      <div
                        style={{
                          width: 48,
                          height: 28,
                          borderRadius: 6,
                          background: `linear-gradient(90deg, ${t.stripe1}, ${t.primary}, ${t.stripe2})`,
                          border: "1px solid var(--border)",
                        }}
                      />
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.name}</div>
                    </label>
                  ))}
                </div>
                <button type="submit" className={ui.btnPrimary}>
                  Save theme
                </button>
              </form>
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
              <button type="submit" className={ui.btnPrimary} style={{ justifySelf: "start" }}>
                Save page settings
              </button>
            </form>
          </div>
        ) : null}

        {activeTab === "Viewers" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Viewers
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted-strong)" }}>
              Live viewer counts will appear here once the event is live and analytics are connected. No viewer
              sessions recorded yet.
            </p>
          </div>
        ) : null}

        {activeTab === "Recording" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Recording
            </div>
            {recording ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Status: {recording.status || "Available"}</div>
                {recording.durationSec != null ? (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    Duration: {Math.round(recording.durationSec / 60)} min
                  </div>
                ) : null}
                {recording.fileUrl ? (
                  <a className={ui.btnPrimary} href={recording.fileUrl} target="_blank" rel="noreferrer" style={{ width: "fit-content", textDecoration: "none" }}>
                    Download recording
                  </a>
                ) : (
                  <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Recording file is not ready for download yet.</p>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: "var(--muted-strong)" }}>
                Recording will be available after the event ends.
              </p>
            )}
          </div>
        ) : null}

        {activeTab === "Analytics" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Analytics
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted-strong)", marginBottom: 14 }}>
              Peak concurrent viewers, watch time, and engagement will show here after the event goes live.
            </p>
            <div className={ui.grid2}>
              <div className={ui.card} style={{ padding: 14 }}>
                <div className={ui.label}>Peak viewers</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>—</div>
              </div>
              <div className={ui.card} style={{ padding: 14 }}>
                <div className={ui.label}>Watch time</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>—</div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "Settings" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Access &amp; visibility
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted-strong)", marginBottom: 16 }}>
              Manage visibility, access, and who can open this event page.
            </p>
            <form action={saveEventAccessAction} style={{ display: "grid", gap: 14, maxWidth: 480 }}>
              <input type="hidden" name="eventId" value={eventId} />
              <div>
                <label className={ui.label} htmlFor="accessType">
                  Access type
                </label>
                <select
                  className={ui.input}
                  id="accessType"
                  name="accessType"
                  defaultValue={access?.accessType || "PUBLIC"}
                >
                  <option value="PUBLIC">Public — anyone with the link</option>
                  <option value="PRIVATE">Private — password required</option>
                </select>
              </div>
              <div>
                <label className={ui.label} htmlFor="password">
                  Password (required for private)
                </label>
                <input className={ui.input} id="password" name="password" type="password" minLength={4} placeholder="••••••••" />
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, fontWeight: 600 }}>
                <input type="checkbox" name="isEnabled" defaultChecked={access?.isEnabled !== false} />
                Access enabled
              </label>
              <button type="submit" className={ui.btnPrimary} style={{ justifySelf: "start" }}>
                Save settings
              </button>
            </form>
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
              <Link
                className={ui.btnOutlineSm}
                href={`/vendor/events/new?step=5&eventId=${encodeURIComponent(eventId)}`}
                style={{ textDecoration: "none" }}
              >
                Publish / unpublish wizard
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
