import Image from "next/image";
import { logout } from "@/lib/auth";
import styles from "./Topbar.module.css";

export function Topbar() {
  return (
    <div className={styles.topbar}>
      <input placeholder="Search events, customers..." className={styles.search} />
      <div className={styles.right}>
        <div className={styles.bell}>
          <div className={styles.bellDot} />
          <div className={styles.bellInitial}>N</div>
        </div>
        <div className={styles.profile}>
          <Image src="/img/logo.png" alt="SV Events avatar" width={34} height={34} className={styles.avatar} />
          <div>
            <div className={styles.profileName}>SV Events</div>
            <div className={styles.profileRole}>Vendor</div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className={styles.signOut}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
