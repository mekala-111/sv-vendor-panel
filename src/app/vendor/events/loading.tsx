import ui from "@/components/ui.module.css";

export default function EventsLoading() {
  return (
    <>
      <h1 className={ui.pageTitle}>Events</h1>
      <div className={ui.card} style={{ color: "var(--muted)" }}>
        Loading events…
      </div>
    </>
  );
}
