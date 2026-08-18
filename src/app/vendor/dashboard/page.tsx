import Link from "next/link";
import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import {
  dashboardStats,
  liveEvents,
  notifications,
  recentEvents,
  revenueBars,
  upcomingEvents,
} from "@/lib/data";
import styles from "./page.module.css";

const RECENT_COLS = "2fr 1.3fr 1.3fr 1fr 0.8fr";

export default function DashboardPage() {
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Good morning, SV Events! 👋</h1>
          <div className={styles.subGreeting}>Here&apos;s what&apos;s happening with your events today.</div>
        </div>
        <div className={styles.dateBadge}>May 18 – May 24, 2025</div>
      </div>

      <div className={styles.statsGrid}>
        {dashboardStats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statDot} style={{ background: s.color }} />
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statDelta}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className={styles.midRow}>
        <div className={ui.card}>
          <div className={ui.sectionTitle} style={{ marginBottom: 16 }}>
            Revenue Overview
          </div>
          <div className={styles.chartBars}>
            {revenueBars.map((h, i) => (
              <div key={i} className={styles.bar} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className={ui.card + " " + styles.donutWrap}>
          <div className={`${ui.sectionTitle} ${styles.donutTitle}`} style={{ marginBottom: 16 }}>
            Events Overview
          </div>
          <div className={styles.donut}>
            <div className={styles.donutHole}>
              <div className={styles.donutTotal}>156</div>
              <div className={styles.donutLabel}>Total</div>
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.sectionHead}>
            <div className={ui.sectionTitle}>Live Events</div>
            <Link href="/vendor/events?filter=Live" className={ui.viewAll}>
              View All
            </Link>
          </div>
          {liveEvents.map((e) => (
            <div key={e.name} className={styles.liveRow}>
              <div className={styles.liveInfo}>
                <div className={styles.liveName}>{e.name}</div>
                <div className={styles.liveMeta}>
                  {e.location} · {e.viewers}
                </div>
              </div>
              <div className={styles.liveTag}>LIVE</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={ui.card}>
          <div className={ui.sectionHead}>
            <div className={ui.sectionTitle}>Recent Events</div>
            <Link href="/vendor/events" className={ui.viewAll}>
              View All
            </Link>
          </div>
          <div className={ui.tableHead} style={{ gridTemplateColumns: RECENT_COLS, paddingBottom: 8 }}>
            <div>EVENT</div>
            <div>DATE &amp; TIME</div>
            <div>CUSTOMER</div>
            <div>STATUS</div>
            <div>VIEWERS</div>
          </div>
          {recentEvents.map((r) => (
            <div key={r.name} className={ui.tableRow} style={{ gridTemplateColumns: RECENT_COLS, padding: "11px 0" }}>
              <div className={ui.ellipsis} style={{ fontWeight: 600 }}>
                {r.name}
              </div>
              <div style={{ color: "var(--muted-strong)" }}>{r.datetime}</div>
              <div className={ui.ellipsis} style={{ color: "var(--muted-strong)" }}>
                {r.customer}
              </div>
              <div>
                <Badge label={r.status} />
              </div>
              <div style={{ fontWeight: 600 }}>{r.viewers}</div>
            </div>
          ))}
        </div>

        <div className={ui.card}>
          <div className={ui.sectionHead}>
            <div className={ui.sectionTitle}>Upcoming Events</div>
            <Link href="/vendor/events?filter=Upcoming" className={ui.viewAll}>
              View All
            </Link>
          </div>
          {upcomingEvents.map((u) => (
            <div key={u.name} className={styles.upcomingRow}>
              <div className={styles.upcomingDate}>
                <div className={styles.upcomingMonth}>{u.month}</div>
                <div className={styles.upcomingDay}>{u.day}</div>
              </div>
              <div className={styles.upcomingInfo}>
                <div className={styles.upcomingName}>{u.name}</div>
                <div className={styles.upcomingMeta}>
                  {u.time} · {u.customer}
                </div>
              </div>
              <div className={styles.upcomingTag}>UPCOMING</div>
            </div>
          ))}
        </div>
      </div>

      <div className={ui.card}>
        <div className={ui.sectionHead}>
          <div className={ui.sectionTitle}>Recent Notifications</div>
          <div className={ui.viewAll}>View All</div>
        </div>
        {notifications.map((n, i) => (
          <div key={i} className={styles.notifRow}>
            <div className={styles.notifDot} style={{ background: n.color }} />
            <div>
              <div className={styles.notifText}>{n.text}</div>
              <div className={styles.notifTime}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
