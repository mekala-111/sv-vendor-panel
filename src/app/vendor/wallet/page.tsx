import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchWallet, fetchWalletTransactions } from "@/lib/hooks/useWallet";

const COLS = "1.6fr 1fr 1fr 1fr";

function typeLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatAmount(amount: number, type: string): string {
  const sign = type === "CREDIT" || type === "REFUND" ? "+" : "-";
  return `${sign}₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

export default async function WalletPage() {
  let wallet: Awaited<ReturnType<typeof fetchWallet>> | null = null;
  let transactions: Awaited<ReturnType<typeof fetchWalletTransactions>> | null = null;
  let loadError: string | null = null;
  try {
    [wallet, transactions] = await Promise.all([fetchWallet(), fetchWalletTransactions({ limit: 20 })]);
  } catch {
    loadError = "Couldn't load wallet data. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Wallet</h1>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <>
          <div className={ui.grid3} style={{ marginBottom: 20 }}>
            <div style={{ background: "#191310", borderRadius: 12, padding: 20, color: "#fff" }}>
              <div style={{ fontSize: 12.5, color: "#B7ADA4", fontWeight: 600, marginBottom: 8 }}>Current Balance</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>₹{wallet!.balance.toLocaleString("en-IN")}</div>
            </div>
            <div className={ui.card}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>Total Spent</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                ₹
                {transactions!.items
                  .filter((t) => t.type === "DEBIT")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString("en-IN")}
              </div>
            </div>
            <div className={ui.card}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>Credits Received</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1E9E5A" }}>
                ₹
                {transactions!.items
                  .filter((t) => t.type === "CREDIT")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Transactions</div>
          <div className={ui.cardTight}>
            <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
              <div>DESCRIPTION</div>
              <div>TYPE</div>
              <div>AMOUNT</div>
              <div>DATE</div>
            </div>
            {transactions!.items.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>No transactions yet.</div>
            ) : (
              transactions!.items.map((tx) => (
                <div key={tx.id} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
                  <div style={{ fontWeight: 600 }}>{tx.description || tx.referenceType || "Wallet transaction"}</div>
                  <div>
                    <Badge label={typeLabel(tx.type)} />
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: tx.type === "CREDIT" || tx.type === "REFUND" ? "#1E9E5A" : "#E4362B",
                    }}
                  >
                    {formatAmount(tx.amount, tx.type)}
                  </div>
                  <div style={{ color: "var(--muted-strong)" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
