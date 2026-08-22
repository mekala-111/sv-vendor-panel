import ui from "@/components/ui.module.css";
import { formatINR } from "@/lib/api";
import { updateVendorSettingsAction } from "@/lib/settings-actions";
import { fetchPricing, fetchVendorProfile } from "@/lib/server-data";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const saved = Array.isArray(sp.saved) ? sp.saved[0] : sp.saved;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const [profile, pricing] = await Promise.all([fetchVendorProfile(), fetchPricing()]);
  const legacyFee = profile?.eventCreationFee && profile.eventCreationFee > 0 ? profile.eventCreationFee : 0;
  const liveEventFee = Number(profile?.liveEventCreationFee ?? legacyFee);
  const invitationFee = Number(profile?.invitationCreationFee ?? legacyFee);
  const liveEventFeeLabel = liveEventFee > 0 ? formatINR(liveEventFee) : null;
  const invitationFeeLabel = invitationFee > 0 ? formatINR(invitationFee) : null;

  return (
    <>
      <h1 className={ui.pageTitle}>Settings</h1>

      {saved ? (
        <div
          className={ui.card}
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            fontSize: 13.5,
            color: "#1f6b3a",
            background: "#edf8f0",
            borderColor: "#b8e0c4",
          }}
        >
          Settings saved successfully.
        </div>
      ) : null}

      {error ? (
        <div
          className={ui.card}
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            fontSize: 13.5,
            color: "#9b1c1c",
            background: "#fef2f2",
            borderColor: "#fecaca",
          }}
        >
          {decodeURIComponent(error)}
        </div>
      ) : null}

      {!profile ? (
        <div className={ui.card} style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 16 }}>
          Could not load vendor profile.
        </div>
      ) : (
        <form action={updateVendorSettingsAction} className={ui.card} style={{ padding: 20, maxWidth: 560 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>General</div>

          <div style={{ display: "grid", gap: 14 }}>
            <label className={ui.field}>
              <span className={ui.label}>Company Name</span>
              <input
                className={ui.input}
                name="companyName"
                defaultValue={profile.companyName || ""}
                required
                minLength={2}
                placeholder="Your company name"
              />
            </label>

            <label className={ui.field}>
              <span className={ui.label}>Phone</span>
              <input
                className={ui.input}
                value={profile.phone || "—"}
                readOnly
                aria-readonly="true"
                style={{ background: "var(--bg)", color: "var(--muted-strong)", cursor: "not-allowed" }}
              />
            </label>

            <label className={ui.field}>
              <span className={ui.label}>Email</span>
              <input
                className={ui.input}
                value={profile.email || "—"}
                readOnly
                aria-readonly="true"
                style={{ background: "var(--bg)", color: "var(--muted-strong)", cursor: "not-allowed" }}
              />
            </label>

            <label className={ui.field}>
              <span className={ui.label}>Address</span>
              <textarea
                className={ui.input}
                name="address"
                defaultValue={profile.address || ""}
                rows={3}
                placeholder="Business address"
                style={{ resize: "vertical", minHeight: 88 }}
              />
            </label>
          </div>

          <button type="submit" className={ui.btnPrimary} style={{ marginTop: 18 }}>
            Save changes
          </button>
        </form>
      )}

      <div className={ui.card} style={{ padding: 20, maxWidth: 560, marginTop: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Pricing</div>

        <div
          style={{
            padding: "12px 14px",
            marginBottom: 18,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.55,
            color: "#5c4a1e",
            background: "#fff8e8",
            border: "1px solid #f0dfa8",
          }}
        >
          <strong style={{ display: "block", marginBottom: 4 }}>Note</strong>
          Event pricing and invitation pricing are set by SV Live admin and cannot be changed here.
          Please contact your admin if you need to update event pricing or invitation pricing for your account.
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Event pricing</div>
        {liveEventFeeLabel ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderTop: "1px solid var(--border-soft)",
              fontSize: 13.5,
            }}
          >
            <div style={{ fontWeight: 600 }}>Live event creation fee</div>
            <div style={{ fontWeight: 800, color: "var(--accent)" }}>{liveEventFeeLabel}</div>
          </div>
        ) : (
          <div style={{ color: "var(--muted)", fontSize: 13.5, paddingBottom: 8 }}>
            No live event pricing assigned yet.
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 700, margin: "18px 0 10px" }}>Invitation pricing</div>
        {invitationFeeLabel ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderTop: "1px solid var(--border-soft)",
              fontSize: 13.5,
            }}
          >
            <div style={{ fontWeight: 600 }}>Invitation creation fee</div>
            <div style={{ fontWeight: 800, color: "var(--accent)" }}>{invitationFeeLabel}</div>
          </div>
        ) : null}
        {pricing.length === 0 && !invitationFeeLabel ? (
          <div style={{ color: "var(--muted)", fontSize: 13.5 }}>No invitation pricing assigned yet.</div>
        ) : (
          pricing.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderTop: "1px solid var(--border-soft)",
                fontSize: 13.5,
              }}
            >
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontWeight: 800, color: "var(--accent)" }}>{item.price}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
