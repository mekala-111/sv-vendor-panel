import Link from "next/link";
import ui from "@/components/ui.module.css";
import { fetchVendorThemes } from "@/lib/hooks/useThemes";
import styles from "./themes.module.css";

export default async function ThemesPage() {
  let themes: Awaited<ReturnType<typeof fetchVendorThemes>> = [];
  let loadError: string | null = null;
  try {
    themes = await fetchVendorThemes();
  } catch {
    loadError = "Couldn't load themes. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Themes</h1>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}>
        Themes assigned to your account by SV Live. Pick one when creating an event.
      </div>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : themes.length === 0 ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          No themes have been assigned to your account yet — contact your admin.
        </div>
      ) : (
        <div className={ui.grid4}>
          {themes.map((a) => {
            const colors = a.theme.config?.colors;
            return (
              <div key={a.theme.id} className={styles.themeCard}>
                <div
                  className={styles.stripe}
                  style={{
                    background: colors?.primary
                      ? `repeating-linear-gradient(45deg, ${colors.primary}, ${colors.primary} 10px, ${colors.secondary ?? colors.primary} 10px, ${colors.secondary ?? colors.primary} 20px)`
                      : "var(--border-soft)",
                  }}
                />
                <div className={styles.body}>
                  <div className={styles.name}>
                    {a.theme.name} {a.isDefault && <span style={{ color: "var(--accent)", fontWeight: 700 }}>· Default</span>}
                  </div>
                  <Link
                    href={`/vendor/events/new?themeId=${a.theme.id}`}
                    className={ui.btnPrimary}
                    style={{ display: "block", textAlign: "center", padding: "7px 0", fontSize: 11.5 }}
                  >
                    Use in New Event
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
