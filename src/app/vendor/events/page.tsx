import Link from "next/link";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { fetchEvents } from "@/lib/server-data";

const COLS = "2fr 1.3fr 1.3fr 1fr 0.8fr 1fr";
const FILTERS = ["All", "Live", "Upcoming", "Completed"];

export default async function EventsListPage(props: PageProps<"/vendor/events">) {
  const { filter } = await props.searchParams;
  const selected = Array.isArray(filter) ? filter[0] : filter;
  const activeFilter = FILTERS.find((f) => f === selected) ?? "All";

  const events = await fetchEvents();
  const filtered = activeFilter === "All" ? events : events.filter((e) => e.status === activeFilter);

  return (
    <>
      <h1 className={ui.pageTitle}>Manage Live Events</h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <LinkTabs
          active={activeFilter}
          items={FILTERS.map((f) => ({ label: f, href: `/vendor/events?filter=${f}` }))}
        />
        <Link href="/vendor/events/new" className={ui.btnPrimary}>
          + Create Live Event
        </Link>
      </div>
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>EVENT</div>
          <div>DATE &amp; TIME</div>
          <div>CUSTOMER</div>
          <div>STATUS</div>
          <div>VIEWERS</div>
          <div>REVENUE</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
            No live events found.
          </div>
        ) : (
          filtered.map((r) => (
            <Link
              key={r._id ?? r.id}
              href={`/vendor/events/${r._id ?? r.id}`}
              className={`${ui.tableRow} ${ui.rowLink}`}
              style={{ gridTemplateColumns: COLS, color: "inherit" }}
            >
              <div className={ui.ellipsis} style={{ fontWeight: 700 }}>
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
              <div style={{ fontWeight: 600 }}>{r.revenue}</div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
