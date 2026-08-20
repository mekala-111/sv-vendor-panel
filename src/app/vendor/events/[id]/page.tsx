import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import { CopyButton } from "@/components/CopyButton";
import ui from "@/components/ui.module.css";
import { fetchEventDetail, fetchShareInfo } from "@/lib/hooks/useEvents";
import { fetchVendorThemes } from "@/lib/hooks/useThemes";
import { fetchYoutubeChannels } from "@/lib/hooks/useYoutube";
import { publishEventAction, unpublishEventAction, cancelEventAction, setEventAccessAction, setEventThemeConfigAction } from "@/lib/events";
import { createYoutubeStreamAction, syncYoutubeAction } from "@/lib/youtube";

const TABS = ["Overview", "YouTube", "Theme", "Access"] as const;
type Tab = (typeof TABS)[number];

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** eventDate is a date-only field stored at UTC midnight — showing it with a time-of-day is misleading, so format it without one. */
function formatDateOnly(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatTimeOnly(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function EventDetailPage(props: PageProps<"/vendor/events/[id]">) {
  const { id } = await props.params;
  const { tab, error } = await props.searchParams;

  const event = await fetchEventDetail(id);
  if (!event) notFound();

  const selected = toParam(tab);
  const activeTab: Tab = (TABS as readonly string[]).includes(selected) ? (selected as Tab) : "Overview";
  const errorMessage = toParam(error);

  const [shareInfo, themeAssignments, channels] = await Promise.all([
    event.isPublished ? fetchShareInfo(event.eventSlug) : Promise.resolve(null),
    fetchVendorThemes().catch(() => []),
    fetchYoutubeChannels().catch(() => []),
  ]);

  const currentThemeName = themeAssignments.find((a) => a.themeId === event.themeId)?.theme.name;
  const currentStream = event.youtubeStreams[0];

  return (
    <>
      <Link href="/vendor/events" className={ui.backLink}>
        &larr; Back to Events
      </Link>

      {errorMessage && (
        <div style={{ color: "#E4362B", fontSize: 13, marginBottom: 14, padding: 12, border: "1px solid #E4362B", borderRadius: 8 }} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{event.eventName}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {event.eventDate ? formatDateOnly(event.eventDate) : "No date set"}
            {event.startTime ? `, ${formatTimeOnly(event.startTime)}` : ""} {event.location ? `· ${event.location}` : ""}
            {event.customerId && (
              <>
                {" · "}
                <Link href={`/vendor/customers/${event.customerId}`} className={ui.link}>
                  View Customer
                </Link>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Badge label={statusLabel(event.status)} size="lg" />
          <Link href={`/vendor/events/${event.id}/edit`} className={ui.btnOutlineSm}>
            Edit
          </Link>
          {event.isPublished ? (
            <form action={unpublishEventAction.bind(null, event.id)}>
              <button type="submit" className={ui.btnOutlineSm}>
                Unpublish
              </button>
            </form>
          ) : (
            <form action={publishEventAction.bind(null, event.id)}>
              <button type="submit" className={ui.btnPrimary}>
                Publish
              </button>
            </form>
          )}
          {event.status !== "CANCELLED" && (
            <form action={cancelEventAction.bind(null, event.id)}>
              <button type="submit" className={ui.btnDanger}>
                Cancel Event
              </button>
            </form>
          )}
        </div>
      </div>

      {shareInfo && (
        <div className={ui.card} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Public Event Link</div>
            <div className={ui.ellipsis} style={{ fontSize: 13.5, fontWeight: 600 }}>
              {shareInfo.publicUrl}
            </div>
          </div>
          <CopyButton text={shareInfo.publicUrl} />
          <a href={shareInfo.publicUrl} target="_blank" rel="noreferrer" className={ui.btnOutlineSm}>
            Open Page
          </a>
        </div>
      )}

      <LinkTabs active={activeTab} size="sm" items={TABS.map((t) => ({ label: t, href: `/vendor/events/${event.id}?tab=${t}` }))} />

      {activeTab === "Overview" && (
        <div className={ui.cardTight}>
          {[
            ["Event Code", event.eventCode],
            ["Event Type", event.eventType ?? "–"],
            ["Page Title", event.pageTitle ?? "–"],
            ["Description", event.description ?? "–"],
            ["Live Timing", event.liveTiming ?? "–"],
            ["Cover Image", event.coverImage ?? "–"],
            ["Created", formatDate(event.createdAt)],
            ["Published At", event.publishedAt ? formatDate(event.publishedAt) : "Not published"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13 }}
            >
              <span style={{ color: "var(--muted)" }}>{k}</span>
              <span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "YouTube" && (
        <div className={ui.card}>
          {currentStream ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Linked YouTube Stream</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Video ID: {currentStream.youtubeVideoId ?? "–"}
                  </div>
                </div>
                <Badge label={statusLabel(currentStream.status)} />
              </div>
              {currentStream.youtubeLiveUrl && (
                <a href={currentStream.youtubeLiveUrl} target="_blank" rel="noreferrer" className={ui.btnOutlineSm} style={{ marginRight: 8 }}>
                  Open on YouTube
                </a>
              )}
              <form action={syncYoutubeAction.bind(null, event.id)} style={{ display: "inline" }}>
                <button type="submit" className={ui.btnOutlineSm}>
                  Refresh Status
                </button>
              </form>
            </>
          ) : channels.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              No YouTube channel connected.{" "}
              <Link href="/vendor/youtube" className={ui.link}>
                Connect one
              </Link>{" "}
              first.
            </div>
          ) : (
            <form action={createYoutubeStreamAction.bind(null, event.id)}>
              <label className={ui.label} htmlFor="youtubeChannelId">
                Channel
              </label>
              <select id="youtubeChannelId" name="youtubeChannelId" required className={ui.input} style={{ marginBottom: 14 }}>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channelName ?? c.channelId}
                  </option>
                ))}
              </select>
              <label className={ui.label} htmlFor="youtubeLiveUrl">
                YouTube Live URL
              </label>
              <input id="youtubeLiveUrl" name="youtubeLiveUrl" className={ui.input} style={{ marginBottom: 14 }} placeholder="https://youtube.com/live/xxxxx" />
              <label className={ui.label} htmlFor="youtubeVideoId">
                Video ID (optional)
              </label>
              <input id="youtubeVideoId" name="youtubeVideoId" className={ui.input} style={{ marginBottom: 14 }} />
              <button type="submit" className={ui.btnPrimary}>
                Link Stream
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === "Theme" && (
        <div className={ui.card}>
          <div style={{ marginBottom: 14, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Current theme: </span>
            <b>{currentThemeName ?? "None selected"}</b>
          </div>
          {themeAssignments.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>No themes assigned to your account yet — contact your admin.</div>
          ) : (
            <form action={setEventThemeConfigAction.bind(null, event.id)}>
              <label className={ui.label} htmlFor="themeId">
                Theme
              </label>
              <select id="themeId" name="themeId" required defaultValue={event.themeId ?? ""} className={ui.input} style={{ marginBottom: 14 }}>
                <option value="" disabled>
                  Select a theme
                </option>
                {themeAssignments.map((a) => (
                  <option key={a.theme.id} value={a.theme.id}>
                    {a.theme.name}
                  </option>
                ))}
              </select>
              <div className={ui.grid2} style={{ marginBottom: 14 }}>
                <div>
                  <label className={ui.label} htmlFor="primaryColor">
                    Primary Color
                  </label>
                  <input id="primaryColor" name="primaryColor" type="text" placeholder="#C77B3E" defaultValue={event.themeConfig?.primaryColor ?? ""} className={ui.input} />
                </div>
                <div>
                  <label className={ui.label} htmlFor="secondaryColor">
                    Secondary Color
                  </label>
                  <input id="secondaryColor" name="secondaryColor" type="text" placeholder="#F3D9C0" defaultValue={event.themeConfig?.secondaryColor ?? ""} className={ui.input} />
                </div>
              </div>
              <label className={ui.label} htmlFor="logo">
                Logo URL (optional)
              </label>
              <input id="logo" name="logo" className={ui.input} style={{ marginBottom: 14 }} defaultValue={event.themeConfig?.logo ?? ""} />
              <button type="submit" className={ui.btnPrimary}>
                Save Theme
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === "Access" && (
        <div className={ui.card}>
          <div style={{ marginBottom: 14, fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Current access: </span>
            <b>{event.access ? statusLabel(event.access.accessType) : "Public"}</b>
          </div>
          <form action={setEventAccessAction.bind(null, event.id)}>
            <label className={ui.label} htmlFor="accessType">
              Access Type
            </label>
            <select id="accessType" name="accessType" defaultValue={event.access?.accessType ?? "PUBLIC"} className={ui.input} style={{ marginBottom: 14 }}>
              <option value="PUBLIC">Public — anyone with the link</option>
              <option value="PRIVATE">Private — requires a password</option>
            </select>
            <label className={ui.label} htmlFor="password">
              Password (required if private)
            </label>
            <input id="password" name="password" type="text" minLength={4} className={ui.input} style={{ marginBottom: 14 }} placeholder="Leave blank to keep current password" />
            <button type="submit" className={ui.btnPrimary}>
              Save Access Settings
            </button>
          </form>
        </div>
      )}
    </>
  );
}
