import Link from "next/link";
import ui from "@/components/ui.module.css";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <h1 className={ui.pageTitle} style={{ marginBottom: 8 }}>
          Page not found
        </h1>
        <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: 14 }}>
          That page doesn&apos;t exist or was moved.
        </p>
        <Link href="/" className={ui.btnPrimary}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
