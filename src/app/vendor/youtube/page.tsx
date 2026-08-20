import Link from "next/link";
import ui from "@/components/ui.module.css";
import { fetchYoutubeChannels, fetchYoutubeStreams } from "@/lib/hooks/useYoutube";
import { connectYoutubeAction, disconnectYoutubeAction } from "@/lib/youtube";

const COLS = "2fr 1.3fr 1fr";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function statusTone(status: string): { color: string; bg: string } {
  if (status === "CONNECTED" || status === "LIVE") return { color: "#1E9E5A", bg: "rgba(30,158,90,0.12)" };
  if (status === "ERROR" || status === "TOKEN_EXPIRED") return { color: "#E4362B", bg: "rgba(228,54,43,0.12)" };
  return { color: "#8A7E76", bg: "rgba(138,126,118,0.12)" };
}

export default async function YoutubePage(props: PageProps<"/vendor/youtube">) {
  const params = await props.searchParams;
  const connected = toParam(params.connected);
  const error = toParam(params.error);

  let channels: Awaited<ReturnType<typeof fetchYoutubeChannels>> = [];
  let streams: Awaited<ReturnType<typeof fetchYoutubeStreams>> = [];
  let loadError: string | null = null;
  try {
    [channels, streams] = await Promise.all([fetchYoutubeChannels(), fetchYoutubeStreams()]);
  } catch {
    loadError = "Couldn't load YouTube data. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>YouTube</h1>

      {connected && (
        <div style={{ color: "#1E9E5A", fontSize: 13, marginBottom: 14, padding: 12, border: "1px solid #1E9E5A", borderRadius: 8 }}>
          YouTube channel connected successfully.
        </div>
      )}
      {error && (
        <div style={{ color: "#E4362B", fontSize: 13, marginBottom: 14, padding: 12, border: "1px solid #E4362B", borderRadius: 8 }} role="alert">
          {error}
        </div>
      )}

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Connected Channels</div>
            <form action={connectYoutubeAction}>
              <button type="submit" className={ui.btnPrimary}>
                + Connect YouTube
              </button>
            </form>
          </div>

          {channels.length === 0 ? (
            <div className={ui.card} style={{ marginBottom: 20, color: "var(--muted)" }}>
              No YouTube channel connected yet. Click &ldquo;Connect YouTube&rdquo; to authorize one via Google.
            </div>
          ) : (
            <div className={ui.cardTight} style={{ marginBottom: 20 }}>
              {channels.map((c) => {
                const tone = statusTone(c.status);
                return (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "#E4362B",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                        }}
                      >
                        YT
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.channelName ?? c.channelId}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>Channel ID: {c.channelId}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={ui.badge} style={{ color: tone.color, background: tone.bg }}>
                        {c.status}
                      </span>
                      <form action={disconnectYoutubeAction.bind(null, c.id)}>
                        <button type="submit" className={ui.btnOutlineSm} style={{ color: "#E4362B" }}>
                          Disconnect
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Linked Streams</div>
          <div className={ui.cardTight}>
            <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
              <div>EVENT</div>
              <div>STATUS</div>
              <div>ACTION</div>
            </div>
            {streams.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)" }}>
                No events linked to YouTube yet — link one from an event&apos;s YouTube tab.
              </div>
            ) : (
              streams.map((s) => {
                const tone = statusTone(s.status);
                return (
                  <div key={s.id} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
                    <div style={{ fontWeight: 700 }}>{s.event.eventName}</div>
                    <div>
                      <span className={ui.badge} style={{ color: tone.color, background: tone.bg }}>
                        {s.status}
                      </span>
                    </div>
                    <Link href={`/vendor/events/${s.eventId}?tab=YouTube`} className={ui.link}>
                      Manage
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </>
  );
}
