import ui from "@/components/ui.module.css";
import {
  addYoutubeChannelManualAction,
  connectYoutubeAction,
  disconnectYoutubeAction,
} from "@/lib/youtube-actions";
import { fetchYoutube } from "@/lib/server-data";

const COLS = "2fr 1.3fr 1fr";

function streamStatusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "LIVE" || s === "ACTIVE") return "🔴 Live";
  if (s === "ENDED" || s === "COMPLETED") return "⚫ Ended";
  return "🟡 Scheduled";
}

export default async function YoutubePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const connected = Array.isArray(sp.connected) ? sp.connected[0] : sp.connected;
  const disconnected = Array.isArray(sp.disconnected) ? sp.disconnected[0] : sp.disconnected;
  const errorRaw = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const error = errorRaw ? decodeURIComponent(errorRaw) : null;

  const { channels, streams, oauthConfigured } = await fetchYoutube();
  const connectedChannels = channels.filter((c) => {
    const s = (c.status || "").toUpperCase();
    return s === "CONNECTED" || s === "ACTIVE";
  });

  return (
    <>
      <div className={ui.row} style={{ marginBottom: 18 }}>
        <h1 className={ui.pageTitle} style={{ margin: 0 }}>
          YouTube
        </h1>
        {oauthConfigured ? (
          <form action={connectYoutubeAction}>
            <button type="submit" className={ui.btnPrimary}>
              + Connect with Google
            </button>
          </form>
        ) : null}
      </div>

      {connected ? (
        <p
          style={{
            color: "#1E9E5A",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 14,
            background: "rgba(30,158,90,0.1)",
            padding: "10px 14px",
            borderRadius: 8,
          }}
          role="status"
        >
          YouTube channel connected successfully.
        </p>
      ) : null}
      {disconnected ? (
        <p
          style={{
            color: "var(--muted-strong)",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 14,
            background: "var(--bg)",
            padding: "10px 14px",
            borderRadius: 8,
          }}
          role="status"
        >
          YouTube channel disconnected.
        </p>
      ) : null}
      {error ? (
        <p
          style={{
            color: "#E4362B",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 14,
            background: "rgba(228,54,43,0.08)",
            padding: "10px 14px",
            borderRadius: 8,
          }}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className={ui.card} style={{ marginBottom: 20, maxWidth: 560 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Add YouTube Channel</div>
        {!oauthConfigured ? (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
            Google OAuth is not configured yet. Add a channel manually to use it in event creation,
            or set <code>YOUTUBE_CLIENT_ID</code> / <code>YOUTUBE_CLIENT_SECRET</code> in the backend
            .env for Google Connect.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
            Prefer Google Connect above, or add a channel manually with its YouTube channel ID.
          </p>
        )}

        {oauthConfigured ? (
          <form action={connectYoutubeAction} style={{ marginBottom: 16 }}>
            <button type="submit" className={ui.btnPrimary}>
              Connect YouTube with Google
            </button>
          </form>
        ) : null}

        <form action={addYoutubeChannelManualAction} className={ui.grid2} style={{ gap: 12 }}>
          <div>
            <label className={ui.label} htmlFor="channelName">
              Channel name
            </label>
            <input
              id="channelName"
              name="channelName"
              className={ui.input}
              placeholder="e.g. SV Events Live"
              required
              minLength={2}
            />
          </div>
          <div>
            <label className={ui.label} htmlFor="channelId">
              YouTube channel ID
            </label>
            <input
              id="channelId"
              name="channelId"
              className={ui.input}
              placeholder="e.g. UCxxxxxxxx"
              required
              minLength={3}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className={ui.btnDark}>
              Add Channel
            </button>
          </div>
        </form>
      </div>

      {connectedChannels.length === 0 ? (
        <div className={ui.card} style={{ marginBottom: 20, maxWidth: 560 }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>No channels connected yet.</div>
        </div>
      ) : (
        connectedChannels.map((channel) => (
          <div key={channel.id} className={ui.card} style={{ marginBottom: 16, maxWidth: 560 }}>
            <div className={ui.row} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>YouTube Channel</div>
              <span className={ui.badge} style={{ color: "#1E9E5A", background: "rgba(30,158,90,0.12)" }}>
                🟢 Connected
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
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
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                  {channel.channelName || "YouTube Channel"}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Channel ID: {channel.channelId || channel.id}
                </div>
              </div>
            </div>
            <form action={disconnectYoutubeAction}>
              <input type="hidden" name="channelId" value={channel.id} />
              <button
                type="submit"
                className={ui.btnOutlineSm}
                style={{ padding: "9px 16px", color: "#E4362B" }}
              >
                Disconnect
              </button>
            </form>
          </div>
        ))
      )}

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>YouTube Events</div>
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>EVENT</div>
          <div>YOUTUBE STATUS</div>
          <div>ACTION</div>
        </div>
        {streams.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
            No YouTube streams yet.
          </div>
        ) : (
          streams.map((y) => (
            <div key={y.id} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
              <div style={{ fontWeight: 700 }}>{y.eventId}</div>
              <div>{streamStatusLabel(y.status)}</div>
              <div style={{ color: "var(--accent)", fontWeight: 700 }}>Open YouTube</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
