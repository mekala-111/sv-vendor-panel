import ui from "@/components/ui.module.css";

export default function BrandingPage() {
  return (
    <>
      <h1 className={ui.pageTitle}>Branding</h1>
      <div className={ui.card} style={{ maxWidth: 560 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                border: "1.5px dashed var(--border-dashed)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 9,
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              logo
            </div>
            <div
              style={{
                width: 64,
                height: 64,
                border: "1.5px dashed var(--border-dashed)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 9,
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              favicon
            </div>
          </div>
          <div className={ui.grid3}>
            <div>
              <label className={ui.label}>Primary</label>
              <div className={ui.swatchbox} style={{ background: "#F5820B" }} />
            </div>
            <div>
              <label className={ui.label}>Secondary</label>
              <div className={ui.swatchbox} style={{ background: "#191310" }} />
            </div>
            <div>
              <label className={ui.label}>Accent</label>
              <div className={ui.swatchbox} style={{ background: "#E4362B" }} />
            </div>
          </div>
          <div>
            <label className={ui.label}>Company Name</label>
            <input className={ui.input} defaultValue="SV Events" />
          </div>
          <div className={ui.grid2}>
            <div>
              <label className={ui.label}>Phone</label>
              <input className={ui.input} defaultValue="+91 98765 43210" />
            </div>
            <div>
              <label className={ui.label}>Email</label>
              <input className={ui.input} defaultValue="contact@svevents.in" />
            </div>
          </div>
          <div>
            <label className={ui.label}>Address</label>
            <input className={ui.input} defaultValue="Hyderabad, India" />
          </div>
          <div>
            <label className={ui.label}>Social Links</label>
            <input className={ui.input} placeholder="Instagram, Facebook URLs" />
          </div>
        </div>
        <button
          className={ui.btnPrimary}
          style={{ width: "100%", textAlign: "center", fontWeight: 800, fontSize: 13.5, padding: 12, marginTop: 20 }}
        >
          Save Branding
        </button>
      </div>
    </>
  );
}
