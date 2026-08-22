import ui from "@/components/ui.module.css";
import { fetchVendorProfile } from "@/lib/server-data";

export default async function SettingsPage() {
  const profile = await fetchVendorProfile();

  const cards = [
    {
      title: "General",
      fields: [
        { k: "Company Name", v: profile?.companyName || "—" },
        { k: "Phone", v: profile?.phone || "—" },
        { k: "Email", v: profile?.email || "—" },
        { k: "Address", v: profile?.address || "—" },
      ],
    },
    {
      title: "WhatsApp Support",
      fields: [
        { k: "Support Number", v: profile?.whatsappNumber || "—" },
        { k: "Button on Event Pages", v: profile?.whatsappEnabled ? "Enabled" : "Disabled" },
      ],
    },
    {
      title: "Notifications",
      fields: [
        { k: "Email", v: "Enabled" },
        { k: "SMS", v: "Enabled" },
        { k: "Push", v: "Disabled" },
      ],
    },
    {
      title: "Security",
      fields: [
        { k: "2FA", v: "—" },
        { k: "Password Last Changed", v: "—" },
        { k: "Active Sessions", v: "—" },
      ],
    },
  ];

  return (
    <>
      <h1 className={ui.pageTitle}>Settings</h1>
      {!profile ? (
        <div className={ui.card} style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 16 }}>
          Could not load vendor profile. Showing defaults.
        </div>
      ) : null}
      <div className={ui.grid3}>
        {cards.map((s) => (
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
