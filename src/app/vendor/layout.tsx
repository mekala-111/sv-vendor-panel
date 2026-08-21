import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { fetchWallet } from "@/lib/hooks/useWallet";
import styles from "./layout.module.css";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const wallet = await fetchWallet().catch(() => null);

  return (
    <div className={styles.shell}>
      <Sidebar walletBalance={wallet ? `₹${wallet.balance.toLocaleString("en-IN")}` : "₹0"} />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
