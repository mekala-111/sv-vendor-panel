import ui from "@/components/ui.module.css";
import { ytEvents } from "@/lib/data";

const COLS = "2fr 1.3fr 1fr";

export default function YoutubePage() {
  return (
    <>
      <h1 className={ui.pageTitle}>YouTube</h1>
      <div className={ui.card} style={{ marginBottom: 20, maxWidth: 520 }}>
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
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>SV Events Live</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Channel ID: UC-8f2K...a91Q · Active</div>
          </div>
        </div>
        <div className={ui.row} style={{ justifyContent: "flex-start" }}>
          <button className={ui.btnOutlineSm} style={{ padding: "9px 16px" }}>
            Manage Channel
          </button>
          <button className={ui.btnOutlineSm} style={{ padding: "9px 16px", color: "#E4362B" }}>
            Disconnect
          </button>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>YouTube Events</div>
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>EVENT</div>
          <div>YOUTUBE STATUS</div>
          <div>ACTION</div>
        </div>
        {ytEvents.map((y) => (
          <div key={y.name} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
            <div style={{ fontWeight: 700 }}>{y.name}</div>
            <div>{y.ytStatus}</div>
            <div style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>Open YouTube</div>
          </div>
        ))}
      </div>
    </>
  );
}
