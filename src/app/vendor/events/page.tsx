import Link from "next/link";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { fetchEvents, type EventStatus } from "@/lib/hooks/useEvents";
import styles from "./page.module.css";

const COLS = "2fr 1.3fr 1fr 1fr";
const FILTERS: { label: string; status: EventStatus | "" }[] = [
  { label: "All", status: "" },
  { label: "Draft", status: "DRAFT" },
  { label: "Upcoming", status: "UPCOMING" },
  { label: "Live", status: "LIVE" },
  { label: "Completed", status: "COMPLETED" },
  { label: "Cancelled", status: "CANCELLED" },
];

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function EventsListPage(props: PageProps<"/vendor/events">) {
  const params = await props.searchParams;
  const filter = toParam(params.filter);
  const active = FILTERS.find((f) => f.label === filter) ?? FILTERS[0];
  const page = Math.max(1, Number(toParam(params.page)) || 1);

  let result: Awaited<ReturnType<typeof fetchEvents>> | null = null;
  let loadError: string | null = null;
  try {
    result = await fetchEvents({ page, status: active.status });
  } catch {
    loadError = "Couldn't load events. Please try again.";
  }

  const buildHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (active.label !== "All") qs.set("filter", active.label);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const s = qs.toString();
    return s ? `/vendor/events?${s}` : "/vendor/events";
  };

  return (
    <>
      <h1 className={ui.pageTitle}>Events</h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <LinkTabs
          active={active.label}
          items={FILTERS.map((f) => ({ label: f.label, href: `/vendor/events?filter=${f.label}` }))}
        />
        <Link href="/vendor/events/new" className={ui.btnPrimary}>
          + Create Event
        </Link>
      </div>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <>
          <div className={ui.cardTight}>
            <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
              <div>EVENT</div>
              <div>DATE</div>
              <div>STATUS</div>
              <div>PUBLISHED</div>
            </div>
            {result!.items.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>
                {active.label === "All" ? "No events yet. Create your first event to get started." : `No ${active.label.toLowerCase()} events.`}
              </div>
            ) : (
              result!.items.map((e) => (
                <Link
                  key={e.id}
                  href={`/vendor/events/${e.id}`}
                  className={`${ui.tableRow} ${ui.rowLink}`}
                  style={{ gridTemplateColumns: COLS, color: "inherit" }}
                >
                  <div className={ui.ellipsis} style={{ fontWeight: 700 }}>
                    {e.eventName}
                  </div>
                  <div style={{ color: "var(--muted-strong)" }}>
                    {e.eventDate ? new Date(e.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "–"}
                  </div>
                  <div>
                    <Badge label={statusLabel(e.status)} />
                  </div>
                  <div style={{ color: "var(--muted-strong)" }}>{e.isPublished ? "Yes" : "No"}</div>
                </Link>
              ))
            )}
          </div>

          {result!.totalPages > 1 && (
            <div className={styles.pagination}>
              <Link
                href={buildHref(page - 1)}
                className={ui.btnOutlineSm}
                aria-disabled={page <= 1}
                style={page <= 1 ? { pointerEvents: "none", opacity: 0.5 } : undefined}
              >
                ← Previous
              </Link>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Page {result!.page} of {result!.totalPages} · {result!.total} events
              </span>
              <Link
                href={buildHref(page + 1)}
                className={ui.btnOutlineSm}
                aria-disabled={page >= result!.totalPages}
                style={page >= result!.totalPages ? { pointerEvents: "none", opacity: 0.5 } : undefined}
              >
                Next →
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
