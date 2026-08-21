import ui from "@/components/ui.module.css";
import { fetchVendorBranding } from "@/lib/hooks/useVendor";
import { updateVendorBrandingAction } from "@/lib/vendor";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function BrandingPage(props: PageProps<"/vendor/branding">) {
  const params = await props.searchParams;
  const error = toParam(params.error);
  const saved = toParam(params.saved);

  let branding: Awaited<ReturnType<typeof fetchVendorBranding>> | null = null;
  let loadError: string | null = null;
  try {
    branding = await fetchVendorBranding();
  } catch {
    loadError = "Couldn't load branding. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Branding</h1>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <div className={ui.card} style={{ maxWidth: 560 }}>
          <form action={updateVendorBrandingAction}>
            <div style={{ display: "grid", gap: 16 }}>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label} htmlFor="logo">
                    Logo URL
                  </label>
                  <input
                    id="logo"
                    name="logo"
                    placeholder="https://…"
                    defaultValue={branding!.logo ?? ""}
                    className={ui.input}
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="favicon">
                    Favicon URL
                  </label>
                  <input
                    id="favicon"
                    name="favicon"
                    placeholder="https://…"
                    defaultValue={branding!.favicon ?? ""}
                    className={ui.input}
                  />
                </div>
              </div>

              <div className={ui.grid3}>
                <div>
                  <label className={ui.label} htmlFor="primaryColor">
                    Primary
                  </label>
                  <input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    defaultValue={branding!.primaryColor || "#F5820B"}
                    className={ui.swatchbox}
                    style={{ width: "100%", padding: 4 }}
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="secondaryColor">
                    Secondary
                  </label>
                  <input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    defaultValue={branding!.secondaryColor || "#191310"}
                    className={ui.swatchbox}
                    style={{ width: "100%", padding: 4 }}
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="accentColor">
                    Accent
                  </label>
                  <input
                    id="accentColor"
                    name="accentColor"
                    type="color"
                    defaultValue={branding!.accentColor || "#E4362B"}
                    className={ui.swatchbox}
                    style={{ width: "100%", padding: 4 }}
                  />
                </div>
              </div>

              <div>
                <label className={ui.label} htmlFor="supportEmail">
                  Support Email
                </label>
                <input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  defaultValue={branding!.supportEmail ?? ""}
                  className={ui.input}
                />
              </div>

              <div>
                <label className={ui.label} htmlFor="customDomain">
                  Custom Domain
                </label>
                <input
                  id="customDomain"
                  name="customDomain"
                  placeholder="events.yourcompany.com"
                  defaultValue={branding!.customDomain ?? ""}
                  className={ui.input}
                />
              </div>
            </div>

            {saved ? (
              <p style={{ color: "#1E9E5A", fontSize: 13, marginTop: 14 }}>Branding saved.</p>
            ) : null}
            {error ? (
              <p style={{ color: "#E4362B", fontSize: 13, marginTop: 14 }} role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className={ui.btnPrimary}
              style={{ width: "100%", textAlign: "center", fontWeight: 800, fontSize: 13.5, padding: 12, marginTop: 20 }}
            >
              Save Branding
            </button>
          </form>
        </div>
      )}
    </>
  );
}
