import Link from "next/link";
import { notFound } from "next/navigation";
import ui from "@/components/ui.module.css";
import { fetchThemes } from "@/lib/server-data";
import styles from "./page.module.css";

export default async function ThemeCustomizePage(props: PageProps<"/vendor/themes/[id]/customize">) {
  const { id } = await props.params;
  const themes = await fetchThemes();
  const theme = themes.find((t) => t.slug === id || t._id === id);
  if (!theme) notFound();

  return (
    <>
      <Link href="/vendor/themes" className={ui.backLink}>
        &larr; Back to Themes
      </Link>
      <div className={styles.grid}>
        <div className={ui.card}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Customize — {theme.name}</div>
          <div className={ui.formGrid} style={{ display: "grid", gap: 14 }}>
            <div>
              <label className={ui.label}>Vendor Logo</label>
              <div className={styles.logoBox}>logo</div>
            </div>
            <div className={ui.grid3}>
              <div>
                <label className={ui.label}>Primary</label>
                <div className={ui.swatchbox} style={{ background: theme.primary }} />
              </div>
              <div>
                <label className={ui.label}>Secondary</label>
                <div className={ui.swatchbox} style={{ background: theme.secondary }} />
              </div>
              <div>
                <label className={ui.label}>Accent</label>
                <div className={ui.swatchbox} style={{ background: theme.accent }} />
              </div>
            </div>
            <div>
              <label className={ui.label}>Font</label>
              <select className={ui.input}>
                <option>Manrope</option>
                <option>Playfair Display</option>
                <option>Poppins</option>
              </select>
            </div>
            <div>
              <label className={ui.label}>Footer Text</label>
              <input className={ui.input} placeholder="Powered by SV Events" />
            </div>
            <div className={ui.grid2}>
              <div>
                <label className={ui.label}>Contact Email</label>
                <input className={ui.input} placeholder="hello@svevents.in" />
              </div>
              <div>
                <label className={ui.label}>Contact Phone</label>
                <input className={ui.input} placeholder="+91 98765 43210" />
              </div>
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
            Save Changes
          </button>
        </div>

        <div className={styles.previewCard}>
          <div className={styles.previewHeader} style={{ background: theme.primary }}>
            <div className={styles.previewKicker}>LIVE PREVIEW</div>
            <div className={styles.previewTitle}>Rahul &amp; Priya Wedding</div>
            <div className={styles.previewSub}>May 24, 2025 · Hyderabad</div>
          </div>
          <div
            className={styles.previewPlayer}
            style={{
              background: `repeating-linear-gradient(45deg, ${theme.secondary}, ${theme.secondary} 10px, ${theme.accent} 10px, ${theme.accent} 20px)`,
            }}
          >
            youtube player area
          </div>
          <div className={styles.previewFooter}>Powered by SV Events</div>
        </div>
      </div>
    </>
  );
}
