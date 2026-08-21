"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/vendor/dashboard" },
  { label: "Customers", href: "/vendor/customers" },
  { label: "Events", href: "/vendor/events" },
  { label: "Themes", href: "/vendor/themes" },
  { label: "YouTube", href: "/vendor/youtube" },
  { label: "Wallet", href: "/vendor/wallet" },
  { label: "Payments", href: "/vendor/payments" },
  { label: "Branding", href: "/vendor/branding" },
  { label: "Pricing", href: "/vendor/pricing" },
  { label: "Support", href: "/vendor/support" },
  { label: "Settings", href: "/vendor/settings" },
];

export function Sidebar({ walletBalance }: { walletBalance: string }) {
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
      <div className={styles.walletCard}>
        <div className={styles.walletLabel}>Wallet Balance</div>
        <div className={styles.walletAmount}>{walletBalance}</div>
        <div className={styles.walletSub}>Available Balance</div>
        <Link href="/vendor/wallet" className={styles.walletBtn} onClick={() => setOpen(false)}>
          + Add Money
        </Link>
      </div>
    </div>
    </>
  );
}
