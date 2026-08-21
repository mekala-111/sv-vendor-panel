import ui from "@/components/ui.module.css";
import { fetchVendorProfile } from "@/lib/hooks/useVendor";
import { updateVendorProfileAction } from "@/lib/vendor";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function SettingsPage(props: PageProps<"/vendor/settings">) {
  const params = await props.searchParams;
  const error = toParam(params.error);
  const saved = toParam(params.saved);

  let vendor: Awaited<ReturnType<typeof fetchVendorProfile>> | null = null;
  let loadError: string | null = null;
  try {
    vendor = await fetchVendorProfile();
  } catch {
    loadError = "Couldn't load settings. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Settings</h1>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <div className={ui.card} style={{ maxWidth: 620 }}>
          <form action={updateVendorProfileAction}>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}>General</div>
            <div className={ui.grid2}>
              <div>
                <label className={ui.label} htmlFor="companyName">
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  required
                  minLength={2}
                  defaultValue={vendor!.companyName}
                  className={ui.input}
                  style={{ marginBottom: 14 }}
                />
              </div>
              <div>
                <label className={ui.label} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={vendor!.phone ?? ""}
                  className={ui.input}
                  style={{ marginBottom: 14 }}
                />
              </div>
            </div>
            <div className={ui.grid2}>
              <div>
                <label className={ui.label} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={vendor!.email ?? ""}
                  className={ui.input}
                  style={{ marginBottom: 14 }}
                />
              </div>
              <div>
                <label className={ui.label} htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  defaultValue={vendor!.address ?? ""}
                  className={ui.input}
                  style={{ marginBottom: 14 }}
                />
              </div>
            </div>

            <div style={{ fontSize: 14.5, fontWeight: 700, margin: "20px 0 12px", borderTop: "1px solid var(--border-soft)", paddingTop: 20 }}>
              WhatsApp Support
            </div>
            <div className={ui.grid2}>
              <div>
                <label className={ui.label} htmlFor="whatsappNumber">
                  Support Number
                </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  defaultValue={vendor!.whatsappNumber ?? ""}
                  className={ui.input}
                  style={{ marginBottom: 14 }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", paddingTop: 22 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" name="whatsappEnabled" defaultChecked={vendor!.whatsappEnabled} />
                  Show WhatsApp button on event pages
                </label>
              </div>
            </div>

            {saved ? (
              <p style={{ color: "#1E9E5A", fontSize: 13, marginBottom: 14 }}>Settings saved.</p>
            ) : null}
            {error ? (
              <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 14 }} role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className={ui.btnPrimary} style={{ marginTop: 6 }}>
              Save Changes
            </button>
          </form>
        </div>
      )}
    </>
  );
}
