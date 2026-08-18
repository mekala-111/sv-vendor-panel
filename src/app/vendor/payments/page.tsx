import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { paymentStats, vendorPayments } from "@/lib/data";

const COLS = "1.6fr 1.4fr 1fr 1fr 1fr";

export default function PaymentsPage() {
  return (
    <>
      <h1 className={ui.pageTitle}>Payments</h1>
      <div className={ui.grid4} style={{ marginBottom: 20 }}>
        {paymentStats.map((s) => (
          <div key={s.label} className={ui.card} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>CUSTOMER</div>
          <div>EVENT</div>
          <div>AMOUNT</div>
          <div>STATUS</div>
          <div>DATE</div>
        </div>
        {vendorPayments.map((p, i) => (
          <div key={i} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
            <div style={{ fontWeight: 700 }}>{p.customer}</div>
            <div className={ui.ellipsis} style={{ color: "var(--muted-strong)" }}>
              {p.event}
            </div>
            <div style={{ fontWeight: 600 }}>{p.amount}</div>
            <div>
              <Badge label={p.status} />
            </div>
            <div style={{ color: "var(--muted-strong)" }}>{p.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}
