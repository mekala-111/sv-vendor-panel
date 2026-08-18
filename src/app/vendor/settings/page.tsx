import ui from "@/components/ui.module.css";
import { settingsCards } from "@/lib/data";

export default function SettingsPage() {
  return (
    <>
      <h1 className={ui.pageTitle}>Settings</h1>
      <div className={ui.grid3}>
        {settingsCards.map((s) => (
          <div key={s.title} className={ui.card} style={{ padding: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
            {s.fields.map((f) => (
              <div
                key={f.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderTop: "1px solid var(--border-soft)",
                  fontSize: 12.5,
                }}
              >
                <div style={{ color: "var(--muted)" }}>{f.k}</div>
                <div style={{ fontWeight: 600 }}>{f.v}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
