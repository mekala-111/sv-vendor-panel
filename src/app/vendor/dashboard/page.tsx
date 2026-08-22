import Link from "next/link";
import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { formatINR } from "@/lib/api";
import { fetchDashboard, fetchEvents } from "@/lib/server-data";
import styles from "./page.module.css";

const RECENT_COLS = "2fr 1.3fr 1.3fr 1fr 0.8fr";
const REVENUE_BARS = [30, 42, 38, 50, 44, 48, 55, 50, 58, 68, 80, 92];

export default async function DashboardPage() {
  const [dashboard, events] = await Promise.all([fetchDashboard(), fetchEvents()]);

  const companyName = dashboard?.companyName || "Vendor";
  const stats = [
    { label: "Total Customers", value: String(dashboard?.totalCustomers ?? 0), delta: "", color: "#3E7BD1" },
    { label: "Total Events", value: String(dashboard?.totalEvents ?? 0), delta: "", color: "#3E7BD1" },
    { label: "Live Events", value: String(dashboard?.liveEvents ?? 0), delta: "", color: "#E4362B" },
    { label: "Upcoming Events", value: String(dashboard?.upcomingEvents ?? 0), delta: "", color: "#E0A324" },
    { label: "Completed Events", value: String(dashboard?.completedEvents ?? 0), delta: "", color: "#1E9E5A" },
    {
      label: "Monthly Revenue",
      value: formatINR(dashboard?.monthlyRevenue ?? 0),
      delta: "",
      color: "#F5820B",
    },
  ];

  const live = events.filter((e) => e.status === "Live").slice(0, 4);
  const recent = events.slice(0, 5);
  const upcoming = events.filter((e) => e.status === "Upcoming").slice(0, 5);
  const totalEvents = dashboard?.totalEvents ?? events.length;

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Good morning, {companyName}! 👋</h1>
          <div className={styles.subGreeting}>Here&apos;s what&apos;s happening with your events today.</div>
        </div>
        <div className={styles.dateBadge}>{dateLabel}</div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statDot} style={{ background: s.color }} />
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            {s.delta ? <div className={styles.statDelta}>{s.delta}</div> : null}
          </div>
        ))}
      </div>

      <div className={styles.midRow}>
        <div className={ui.card}>
          <div className={ui.sectionTitle} style={{ marginBottom: 16 }}>
            Revenue Overview
          </div>
          <div className={styles.chartBars}>
            {REVENUE_BARS.map((h, i) => (
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
              <div className={styles.donutTotal}>{totalEvents}</div>
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
          {live.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>No live events right now.</div>
          ) : (
            live.map((e) => (
              <div key={e._id ?? e.name} className={styles.liveRow}>
                <div className={styles.liveInfo}>
                  <div className={styles.liveName}>{e.name}</div>
                  <div className={styles.liveMeta}>
                    {e.location} · {e.viewers}
                  </div>
                </div>
                <div className={styles.liveTag}>LIVE</div>
              </div>
            ))
          )}
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
          {recent.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>No events yet.</div>
          ) : (
            recent.map((r) => (
              <div
                key={r._id ?? r.name}
                className={ui.tableRow}
                style={{ gridTemplateColumns: RECENT_COLS, padding: "11px 0" }}
              >
                <div className={ui.ellipsis} style={{ fontWeight: 600 }}>
                  {r.name}
                </div>
                <div style={{ color: "var(--muted-strong)" }}>
                  {r.date}, {r.time}
                </div>
                <div className={ui.ellipsis} style={{ color: "var(--muted-strong)" }}>
                  {r.customer}
                </div>
                <div>
                  <Badge label={r.status} />
                </div>
                <div style={{ fontWeight: 600 }}>{r.viewers}</div>
              </div>
            ))
          )}
        </div>

        <div className={ui.card}>
          <div className={ui.sectionHead}>
            <div className={ui.sectionTitle}>Upcoming Events</div>
            <Link href="/vendor/events?filter=Upcoming" className={ui.viewAll}>
              View All
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>No upcoming events.</div>
          ) : (
            upcoming.map((u) => {
              const parts = u.date.split(" ");
              const month = (parts[0] || "—").toUpperCase();
              const day = parts[1]?.replace(",", "") || "—";
              return (
                <div key={u._id ?? u.name} className={styles.upcomingRow}>
                  <div className={styles.upcomingDate}>
                    <div className={styles.upcomingMonth}>{month}</div>
                    <div className={styles.upcomingDay}>{day}</div>
                  </div>
                  <div className={styles.upcomingInfo}>
                    <div className={styles.upcomingName}>{u.name}</div>
                    <div className={styles.upcomingMeta}>
                      {u.time} · {u.customer}
                    </div>
                  </div>
                  <div className={styles.upcomingTag}>UPCOMING</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
