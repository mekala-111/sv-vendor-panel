import Link from "next/link";
import styles from "./ui.module.css";

export function LinkTabs({
  items,
  active,
  size = "md",
}: {
  items: { label: string; href: string }[];
  active: string;
  size?: "md" | "sm";
}) {
  const tabClass = size === "sm" ? styles.tabSm : styles.tab;
  return (
    <div className={styles.tabs}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`${tabClass} ${item.label === active ? styles.tabActive : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
