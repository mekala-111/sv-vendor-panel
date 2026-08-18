import { statusTone } from "@/lib/data";
import styles from "./ui.module.css";

export function Badge({ label, size = "sm" }: { label: string; size?: "sm" | "lg" }) {
  const tone = statusTone(label);
  return (
    <span
      className={size === "lg" ? styles.badgeLg : styles.badge}
      style={{ color: tone.color, background: tone.bg }}
    >
      {label}
    </span>
  );
}
