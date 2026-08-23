import Link from "next/link";
import { notFound } from "next/navigation";
import ui from "@/components/ui.module.css";
import { fetchThemes } from "@/lib/server-data";

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
      <h1 className={ui.pageTitle}>{theme.name}</h1>
      <div className={ui.card} style={{ maxWidth: 560 }}>
        <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
          This theme is provided by SV Live admin. You can use it on events and fill the content
          fields. Theme design (layout, colors, sections) is managed by admin only.
        </p>
        <Link
          href="/vendor/events/new?step=2"
          className={ui.btnPrimary}
          style={{
            display: "inline-block",
            marginTop: 16,
            textDecoration: "none",
            textAlign: "center",
            padding: "10px 16px",
            fontSize: 13,
          }}
        >
          Use in event
        </Link>
      </div>
    </>
  );
}
