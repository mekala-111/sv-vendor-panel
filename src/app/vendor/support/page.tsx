import Link from "next/link";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { fetchSupportTickets, type TicketStatus } from "@/lib/hooks/useSupport";
import { createSupportTicketAction } from "@/lib/support";

const COLS = "0.9fr 1.8fr 1fr 1fr";
const FILTERS: { label: string; status: TicketStatus | "" }[] = [
  { label: "All", status: "" },
  { label: "Open", status: "OPEN" },
  { label: "Pending", status: "PENDING" },
  { label: "Resolved", status: "RESOLVED" },
  { label: "Closed", status: "CLOSED" },
];

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function SupportPage(props: PageProps<"/vendor/support">) {
  const params = await props.searchParams;
  const filter = toParam(params.filter);
  const error = toParam(params.error);
  const active = FILTERS.find((f) => f.label === filter) ?? FILTERS[0];

  let result: Awaited<ReturnType<typeof fetchSupportTickets>> | null = null;
  let loadError: string | null = null;
  try {
    result = await fetchSupportTickets({ status: active.status });
  } catch {
    loadError = "Couldn't load tickets. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Support</h1>

      <div className={ui.card} style={{ maxWidth: 560, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New Ticket</div>
        <form action={createSupportTicketAction}>
          <label className={ui.label} htmlFor="subject">
            Subject
          </label>
          <input id="subject" name="subject" required minLength={3} className={ui.input} style={{ marginBottom: 12 }} />

          <div className={ui.grid2}>
            <div>
              <label className={ui.label} htmlFor="category">
                Category
              </label>
              <input id="category" name="category" placeholder="General" className={ui.input} style={{ marginBottom: 12 }} />
            </div>
            <div>
              <label className={ui.label} htmlFor="priority">
                Priority
              </label>
              <select id="priority" name="priority" defaultValue="MEDIUM" className={ui.input} style={{ marginBottom: 12 }}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <label className={ui.label} htmlFor="body">
            Describe the issue
          </label>
          <textarea id="body" name="body" rows={3} className={ui.input} style={{ marginBottom: 12, resize: "vertical" }} />

          {error ? (
            <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 12 }} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className={ui.btnPrimary}>
            Submit Ticket
          </button>
        </form>
      </div>

      <LinkTabs
        active={active.label}
        items={FILTERS.map((f) => ({ label: f.label, href: `/vendor/support?filter=${f.label}` }))}
      />

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <div className={ui.cardTight}>
          <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
            <div>TICKET</div>
            <div>SUBJECT</div>
            <div>PRIORITY</div>
            <div>STATUS</div>
          </div>
          {result!.items.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>No tickets yet.</div>
          ) : (
            result!.items.map((tk) => (
              <Link
                key={tk.id}
                href={`/vendor/support/${tk.id}`}
                className={`${ui.tableRow} ${ui.rowLink}`}
                style={{ gridTemplateColumns: COLS, color: "inherit" }}
              >
                <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", color: "var(--muted)" }}>{tk.ticketCode}</div>
                <div className={ui.ellipsis} style={{ color: "var(--muted-strong)" }}>
                  {tk.subject}
                </div>
                <div>
                  <Badge label={statusLabel(tk.priority)} />
                </div>
                <div>
                  <Badge label={statusLabel(tk.status)} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </>
  );
}
