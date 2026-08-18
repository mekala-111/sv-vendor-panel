import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { eventDetailTabContent, eventDetailTabs, eventQuickActions, events, getEvent, type EventDetailTab } from "@/lib/data";

export function generateStaticParams() {
  return events.map((e) => ({ id: String(e.id) }));
}

export default async function EventDetailPage(props: PageProps<"/vendor/events/[id]">) {
  const { id } = await props.params;
  const { tab } = await props.searchParams;
  const event = getEvent(Number(id));
  if (!event) notFound();

  const selected = Array.isArray(tab) ? tab[0] : tab;
  const activeTab = (eventDetailTabs as readonly string[]).includes(selected ?? "")
    ? (selected as EventDetailTab)
    : "Overview";

  return (
    <>
      <Link href="/vendor/events" className={ui.backLink}>
        &larr; Back to Events
      </Link>
      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{event.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {event.date}, {event.time} · {event.location}
          </div>
        </div>
        <div className={ui.row} style={{ justifyContent: "flex-end" }}>
          <Badge label={event.status} size="lg" />
          <button type="button" className={ui.btnDanger}>OPEN LIVE EVENT</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {eventQuickActions.map((qa) => (
          <button key={qa} className={ui.btnOutlineSm}>
            {qa}
          </button>
        ))}
      </div>

      <LinkTabs
        active={activeTab}
        size="sm"
        items={eventDetailTabs.map((t) => ({ label: t, href: `/vendor/events/${event.id}?tab=${t}` }))}
      />

      <div className={ui.card}>
        <div style={{ fontSize: 13.5, color: "var(--muted-strong)" }}>{eventDetailTabContent(event, activeTab)}</div>
      </div>
    </>
  );
}
