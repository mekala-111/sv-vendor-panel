import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchSupportTicketDetail, type TicketStatus } from "@/lib/hooks/useSupport";
import { addTicketMessageAction, setTicketStatusAction } from "@/lib/support";

const STATUSES: TicketStatus[] = ["OPEN", "PENDING", "RESOLVED", "CLOSED"];

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function SupportTicketDetailPage(props: PageProps<"/vendor/support/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const error = toParam(params.error);

  const ticket = await fetchSupportTicketDetail(id);
  if (!ticket) notFound();

  return (
    <>
      <Link href="/vendor/support" className={ui.backLink}>
        &larr; Back to Support
      </Link>

      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{ticket.subject}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {ticket.ticketCode} · {ticket.category}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge label={statusLabel(ticket.priority)} size="lg" />
          <Badge label={statusLabel(ticket.status)} size="lg" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUSES.filter((s) => s !== ticket.status).map((s) => (
          <form key={s} action={setTicketStatusAction.bind(null, ticket.id, s)}>
            <button type="submit" className={ui.btnOutlineSm}>
              Mark {statusLabel(s)}
            </button>
          </form>
        ))}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Messages</div>
      <div className={ui.cardTight} style={{ marginBottom: 20 }}>
        {ticket.messages.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)" }}>No messages yet.</div>
        ) : (
          ticket.messages.map((m, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{m.authorRole}</div>
              <div style={{ marginBottom: 4 }}>{m.body}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={ui.card} style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add a Message</div>
        <form action={addTicketMessageAction.bind(null, ticket.id)}>
          <textarea name="message" required rows={3} className={ui.input} style={{ marginBottom: 12, resize: "vertical" }} />
          {error ? (
            <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 12 }} role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className={ui.btnPrimary}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}
