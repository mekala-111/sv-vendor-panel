import Link from "next/link";
import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { revenueBars, TONES } from "@/lib/data";
import { fetchDashboardData } from "@/lib/hooks/useDashboard";
import { fetchNotifications } from "@/lib/hooks/useNotifications";
import styles from "./page.module.css";

const NOTIF_COLORS: Record<string, string> = {
  PAYMENT_SUCCESSFUL: "#1E9E5A",
  PAYMENT_FAILED: "#E4362B",
  EVENT_LIVE: "#E4362B",
  EVENT_PUBLISHED: "#3E7BD1",
  EVENT_CREATED: "#3E7BD1",
  YOUTUBE_CONNECTED: "#3E7BD1",
  YOUTUBE_ERROR: "#E4362B",
};

const RECENT_COLS = "2fr 1.3fr 1.3fr 1fr 0.8fr";

/**
 * Dashboard Page — Real Data Edition
 * Fetches actual vendor statistics from backend API
 */
export default async function DashboardPage() {
  // Fetch real data from backend
  const [dashboard, notifications] = await Promise.all([
    fetchDashboardData(),
    fetchNotifications({ limit: 5 }).catch(() => []),
  ]);

  // Format date for display
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const dateRange = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${now.getFullYear()}`;

  // Transform stats into dashboard cards format
  const dashboardStats = [
    {
      label: "Total Customers",
      value: dashboard.stats.totalCustomers.toString(),
      delta: "",
      color: TONES.blue.color,
    },
    {
      label: "Total Events",
      value: dashboard.stats.totalEvents.toString(),
      delta: "",
      color: TONES.blue.color,
    },
    {
      label: "Live Events",
      value: dashboard.stats.liveEvents.toString(),
      delta: dashboard.stats.liveEvents > 0 ? "🔴 LIVE" : "–",
      color: TONES.red.color,
    },
    {
      label: "Upcoming Events",
      value: dashboard.stats.upcomingEvents.toString(),
      delta: "",
      color: TONES.yellow.color,
    },
    {
      label: "Completed Events",
      value: dashboard.stats.completedEvents.toString(),
      delta: "",
      color: TONES.green.color,
    },
    {
      label: "Monthly Revenue",
      value: `₹${(dashboard.stats.monthlyRevenue / 100000).toFixed(2)}L`,
      delta: "",
      color: "#F58220",
    },
  ];

  // Format recent events for table display
  const recentEventsForTable = dashboard.recentEvents.map((e, idx) => ({
    name: e.name,
    datetime: e.startTime
      ? new Date(e.startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "–",
    customer: dashboard.recentCustomers[idx]?.name || "Unknown",
    status: e.status === "LIVE" ? "Live" : e.status === "COMPLETED" ? "Completed" : e.status === "UPCOMING" ? "Upcoming" : e.status,
    viewers: e.viewers?.toString() || "–",
  }));

  // Get live events only
  const liveEvents = dashboard.recentEvents
    .filter((e) => e.status === "LIVE")
    .map((e) => ({
      name: e.name,
      location: "–",
      viewers: (e.viewers || 0) + " watching",
    }));

  // Upcoming events with formatted dates
  const upcomingEvents = dashboard.recentEvents
    .filter((e) => e.status === "UPCOMING")
    .map((e) => {
      const date = new Date(e.startTime || now.getTime());
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        day: date.getDate().toString(),
        name: e.name,
        time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        customer: "Customer",
      };
    });

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, {dashboard.vendor.companyName}! 👋
          </h1>
          <div className={styles.subGreeting}>
            Here&apos;s what&apos;s happening with your events today.
          </div>
        </div>
        <div className={styles.dateBadge}>{dateRange}</div>
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
          <div
            className={`${ui.sectionTitle} ${styles.donutTitle}`}
            style={{ marginBottom: 16 }}
          >
            Events Overview
          </div>
          <div className={styles.donut}>
            <div className={styles.donutHole}>
              <div className={styles.donutTotal}>
                {dashboard.stats.totalEvents}
              </div>
              <div className={styles.donutLabel}>Total</div>
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.sectionHead}>
            <div className={ui.sectionTitle}>Live Events</div>
            {liveEvents.length > 0 && (
              <Link href="/vendor/events?filter=Live" className={ui.viewAll}>
                View All
              </Link>
            )}
          </div>
          {liveEvents.length > 0 ? (
            liveEvents.map((e) => (
              <div key={e.name} className={styles.liveRow}>
                <div className={styles.liveInfo}>
                  <div className={styles.liveName}>{e.name}</div>
                  <div className={styles.liveMeta}>
                    {e.location} · {e.viewers}
                  </div>
                </div>
                <div className={styles.liveTag}>LIVE</div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--muted)", padding: "16px 0" }}>
              No live events right now
            </div>
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
          <div
            className={ui.tableHead}
            style={{ gridTemplateColumns: RECENT_COLS, paddingBottom: 8 }}
          >
            <div>EVENT</div>
            <div>DATE &amp; TIME</div>
            <div>CUSTOMER</div>
            <div>STATUS</div>
            <div>VIEWERS</div>
          </div>
          {recentEventsForTable.length > 0 ? (
            recentEventsForTable.map((r) => (
              <div
                key={r.name}
                className={ui.tableRow}
                style={{ gridTemplateColumns: RECENT_COLS, padding: "11px 0" }}
              >
                <div className={ui.ellipsis} style={{ fontWeight: 600 }}>
                  {r.name}
                </div>
                <div style={{ color: "var(--muted-strong)" }}>
                  {r.datetime}
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
          ) : (
            <div style={{ color: "var(--muted)", padding: "16px 0" }}>
              No events yet
            </div>
          )}
        </div>

        <div className={ui.card}>
          <div className={ui.sectionHead}>
            <div className={ui.sectionTitle}>Upcoming Events</div>
            {upcomingEvents.length > 0 && (
              <Link href="/vendor/events?filter=Upcoming" className={ui.viewAll}>
                View All
              </Link>
            )}
          </div>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((u) => (
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
            ))
          ) : (
            <div style={{ color: "var(--muted)", padding: "16px 0" }}>
              No upcoming events
            </div>
          )}
        </div>
      </div>

      <div className={ui.card}>
        <div className={ui.sectionHead}>
          <div className={ui.sectionTitle}>Recent Notifications</div>
          <div className={ui.viewAll}>View All</div>
        </div>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div key={n.id} className={styles.notifRow}>
              <div
                className={styles.notifDot}
                style={{ background: NOTIF_COLORS[n.type] ?? "#8A7E76" }}
              />
              <div>
                <div className={styles.notifText}>{n.title || n.message}</div>
                <div className={styles.notifTime}>
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: "var(--muted)", padding: "16px 0" }}>
            No notifications
          </div>
        )}
      </div>
    </>
  );
}
