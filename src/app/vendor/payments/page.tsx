import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchPayments } from "@/lib/server-data";

const COLS = "1.2fr 1.2fr 1fr 1fr 1.4fr 1fr";

export default async function PaymentsPage() {
  const { stats, payments } = await fetchPayments();

  return (
    <>
      <h1 className={ui.pageTitle}>Payments</h1>
      {stats.length > 0 ? (
        <div className={ui.grid4} style={{ marginBottom: 20 }}>
          {stats.map((s) => (
            <div key={s.label} className={ui.card} style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>TYPE</div>
          <div>EVENT</div>
          <div>AMOUNT</div>
          <div>STATUS</div>
          <div>UTR / REASON</div>
          <div>DATE</div>
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
            No payments yet.
          </div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
              <div style={{ fontWeight: 700 }}>{p.customer}</div>
              <div className={ui.ellipsis} style={{ color: "var(--muted-strong)" }}>
                {p.event}
              </div>
              <div style={{ fontWeight: 600 }}>{p.amount}</div>
              <div>
                <Badge label={p.status} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted-strong)" }}>
                {p.status === "Rejected" ? (
                  <span style={{ color: "#E4362B", fontWeight: 600 }}>
                    {p.rejectionReason || "Rejected by admin"}
                  </span>
                ) : (
                  <span style={{ fontFamily: "monospace" }}>{p.utrNumber}</span>
                )}
              </div>
              <div style={{ color: "var(--muted-strong)" }}>{p.date}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
