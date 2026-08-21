import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchPayments } from "@/lib/hooks/usePayments";

const COLS = "1fr 1.2fr 1fr 1fr 1fr";

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function PaymentsPage() {
  let payments: Awaited<ReturnType<typeof fetchPayments>> = [];
  let loadError: string | null = null;
  try {
    payments = await fetchPayments();
  } catch {
    loadError = "Couldn't load payments. Please try again.";
  }

  const successPayments = payments.filter((p) => p.status === "SUCCESS");
  const customerPayments = successPayments.filter((p) => p.purpose === "CUSTOMER");
  const eventPayments = successPayments.filter((p) => p.purpose === "EVENT_CREATION");
  const pendingTotal = payments.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0);
  const refundedTotal = payments.filter((p) => p.status === "REFUNDED").reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { label: "Customer Payments", value: customerPayments.reduce((sum, p) => sum + p.amount, 0), color: "#211A15" },
    { label: "Event Payments", value: eventPayments.reduce((sum, p) => sum + p.amount, 0), color: "#1E9E5A" },
    { label: "Pending", value: pendingTotal, color: "#E0A324" },
    { label: "Refunds", value: refundedTotal, color: "#E4362B" },
  ];

  return (
    <>
      <h1 className={ui.pageTitle}>Payments</h1>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <>
          <div className={ui.grid4} style={{ marginBottom: 20 }}>
            {stats.map((s) => (
              <div key={s.label} className={ui.card} style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>₹{s.value.toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>
          <div className={ui.cardTight}>
            <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
              <div>PURPOSE</div>
              <div>REFERENCE</div>
              <div>AMOUNT</div>
              <div>STATUS</div>
              <div>DATE</div>
            </div>
            {payments.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>No payments yet.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
                  <div style={{ fontWeight: 700 }}>{p.purpose === "EVENT_CREATION" ? "Event Creation" : "Customer"}</div>
                  <div className={ui.ellipsis} style={{ color: "var(--muted-strong)" }}>
                    {p.gatewayTransactionId || p.utrNumber || p.id}
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString("en-IN")}</div>
                  <div>
                    <Badge label={statusLabel(p.status)} />
                  </div>
                  <div style={{ color: "var(--muted-strong)" }}>
                    {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
