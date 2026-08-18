import Link from "next/link";
import ui from "@/components/ui.module.css";
import { vendorThemes } from "@/lib/data";
import styles from "./themes.module.css";

export default function ThemesPage() {
  return (
    <>
      <h1 className={ui.pageTitle}>Themes</h1>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}>
        Themes assigned to your account by SV Live. Preview, apply, or customize colors and branding for each.
      </div>
      <div className={ui.grid4}>
        {vendorThemes.map((th) => (
          <div key={th.slug} className={styles.themeCard}>
            <div
              className={styles.stripe}
              style={{
                background: `repeating-linear-gradient(45deg, ${th.stripe1}, ${th.stripe1} 10px, ${th.stripe2} 10px, ${th.stripe2} 20px)`,
              }}
            />
            <div className={styles.body}>
              <div className={styles.name}>{th.name}</div>
              <div className={styles.actions}>
                <button className={ui.btnOutline} style={{ flex: 1, textAlign: "center", padding: "7px 0", fontSize: 11.5 }}>
                  Preview
                </button>
                <button className={ui.btnPrimary} style={{ flex: 1, textAlign: "center", padding: "7px 0", fontSize: 11.5 }}>
                  Use
                </button>
              </div>
              <Link href={`/vendor/themes/${th.slug}/customize`} className={styles.customizeLink}>
                Customize
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
