import Link from "next/link";
import ui from "@/components/ui.module.css";
import { fetchThemes } from "@/lib/server-data";
import styles from "./themes.module.css";

export default async function ThemesPage() {
  const themes = await fetchThemes();

  return (
    <>
      <h1 className={ui.pageTitle}>Themes</h1>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}>
        All active themes created by SV Live admin. Choose one when creating an event — guests open that
        event on its unique slug in the selected theme.
      </div>
      {themes.length === 0 ? (
        <div className={ui.card} style={{ color: "var(--muted)", fontSize: 13.5 }}>
          No active themes yet. Ask an admin to create and publish themes.
        </div>
      ) : (
        <div className={ui.grid4}>
          {themes.map((th) => (
            <div key={th._id || th.slug} className={styles.themeCard}>
              <div
                className={styles.stripe}
                style={{
                  background: `repeating-linear-gradient(45deg, ${th.stripe1}, ${th.stripe1} 10px, ${th.stripe2} 10px, ${th.stripe2} 20px)`,
                }}
              />
              <div className={styles.body}>
                <div className={styles.name}>{th.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>
                  Layout: {th.layout || th.slug}
                </div>
                <Link
                  href={`/vendor/events/new?step=3`}
                  className={ui.btnPrimary}
                  style={{ display: "block", textAlign: "center", padding: "7px 0", fontSize: 11.5, textDecoration: "none" }}
                >
                  Use in new event
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
