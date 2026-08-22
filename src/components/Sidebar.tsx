"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/vendor/dashboard" },
  { label: "Customers", href: "/vendor/customers" },
  { label: "Manage Live Events", href: "/vendor/events" },
  { label: "Manage Invitations", href: "/vendor/invitations" },
  { label: "Themes", href: "/vendor/themes" },
  { label: "Payments", href: "/vendor/payments" },
  { label: "Settings", href: "/vendor/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.menuBtn} aria-label="Open menu" onClick={() => setOpen(true)}>
        <span />
        <span />
        <span />
      </button>
      {open ? (
        <button type="button" className={styles.backdrop} aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <div className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brandRow}>
          <Image src="/img/logo.png" alt="SV Live Events logo" width={38} height={38} className={styles.logo} />
          <div>
            <div className={styles.brandName}>SV LIVE</div>
            <div className={styles.brandSub}>EVENTS</div>
          </div>
          <button type="button" className={styles.closeBtn} aria-label="Close menu" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className={styles.panelLabel}>Vendor Panel</div>
        <nav className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
