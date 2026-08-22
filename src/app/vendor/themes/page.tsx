import ui from "@/components/ui.module.css";
import { fetchThemes } from "@/lib/server-data";
import { ThemesGallery } from "./ThemesGallery";

export default async function ThemesPage() {
  const themes = await fetchThemes();

  return (
    <>
      <h1 className={ui.pageTitle}>Themes</h1>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}>
        Themes assigned by SV Live admin. Only themes assigned to your account appear here.
      </div>
      {themes.length === 0 ? (
        <div className={ui.card} style={{ color: "var(--muted)", fontSize: 13.5 }}>
          No active themes yet. Ask an admin to create and assign themes to your account.
        </div>
      ) : (
        <ThemesGallery themes={themes} />
      )}
    </>
  );
}
