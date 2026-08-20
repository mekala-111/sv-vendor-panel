import Link from "next/link";
import { notFound } from "next/navigation";
import ui from "@/components/ui.module.css";
import { fetchEventDetail } from "@/lib/hooks/useEvents";
import { updateEventAction } from "@/lib/events";
import { eventTypeOptions } from "@/lib/data";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EditEventPage(props: PageProps<"/vendor/events/[id]/edit">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const error = toParam(params.error);

  const event = await fetchEventDetail(id);
  if (!event) notFound();

  const eventDateValue = event.eventDate ? event.eventDate.slice(0, 10) : "";

  return (
    <>
      <Link href={`/vendor/events/${id}`} className={ui.backLink}>
        &larr; Back to Event
      </Link>
      <h1 className={ui.pageTitle}>Edit Event</h1>

      <div className={ui.card} style={{ maxWidth: 520 }}>
        <form action={updateEventAction.bind(null, id)}>
          <label className={ui.label} htmlFor="eventName">
            Event Name
          </label>
          <input id="eventName" name="eventName" required minLength={2} defaultValue={event.eventName} className={ui.input} style={{ marginBottom: 14 }} />

          <div className={ui.grid2} style={{ marginBottom: 14 }}>
            <div>
              <label className={ui.label} htmlFor="eventType">
                Event Type
              </label>
              <select id="eventType" name="eventType" defaultValue={event.eventType ?? ""} className={ui.input}>
                <option value="">—</option>
                {eventTypeOptions.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label} htmlFor="eventDate">
                Event Date
              </label>
              <input id="eventDate" name="eventDate" type="date" defaultValue={eventDateValue} className={ui.input} />
            </div>
          </div>

          <label className={ui.label} htmlFor="location">
            Location
          </label>
          <input id="location" name="location" defaultValue={event.location ?? ""} className={ui.input} style={{ marginBottom: 14 }} />

          <label className={ui.label} htmlFor="pageTitle">
            Page Title
          </label>
          <input id="pageTitle" name="pageTitle" defaultValue={event.pageTitle ?? ""} className={ui.input} style={{ marginBottom: 14 }} />

          <label className={ui.label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={event.description ?? ""}
            className={ui.input}
            style={{ marginBottom: 14, resize: "vertical" }}
          />

          <label className={ui.label} htmlFor="coverImage">
            Cover Image URL
          </label>
          <input id="coverImage" name="coverImage" defaultValue={event.coverImage ?? ""} className={ui.input} style={{ marginBottom: 14 }} />

          {error ? (
            <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 14 }} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className={ui.btnPrimary}>
            Save Changes
          </button>
        </form>
      </div>
    </>
  );
}
