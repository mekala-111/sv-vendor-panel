import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import styles from "./layout.module.css";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
