import ui from "@/components/ui.module.css";

export default function EventDetailLoading() {
  return (
    <div className={ui.card} style={{ color: "var(--muted)" }}>
      Loading event…
    </div>
  );
}
