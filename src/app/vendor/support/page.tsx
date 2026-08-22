import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchTickets } from "@/lib/server-data";

const COLS = "0.7fr 1.8fr 1fr 1fr";

export default async function SupportPage() {
  const tickets = await fetchTickets();

  return (
    <>
      <h1 className={ui.pageTitle}>Support</h1>
      <div className={ui.row} style={{ marginBottom: 14, justifyContent: "flex-end" }}>
        <button className={ui.btnPrimary}>+ New Ticket</button>
      </div>
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>TICKET</div>
          <div>ISSUE</div>
          <div>PRIORITY</div>
          <div>STATUS</div>
        </div>
        {tickets.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
            No support tickets yet.
          </div>
        ) : (
          tickets.map((tk) => (
            <div key={tk._id ?? tk.id} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", color: "var(--muted)" }}>
                {tk.id}
              </div>
              <div style={{ color: "var(--muted-strong)" }}>{tk.issue}</div>
              <div>
                <Badge label={tk.priority} />
              </div>
              <div>
                <Badge label={tk.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
