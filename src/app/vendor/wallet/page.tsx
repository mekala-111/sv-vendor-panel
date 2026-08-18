import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { walletBalance, walletTx } from "@/lib/data";

const COLS = "1.6fr 1fr 1fr 1fr";

export default function WalletPage() {
  return (
    <>
      <h1 className={ui.pageTitle}>Wallet</h1>
      <div className={ui.grid3} style={{ marginBottom: 20 }}>
        <div style={{ background: "#191310", borderRadius: 12, padding: 20, color: "#fff" }}>
          <div style={{ fontSize: 12.5, color: "#B7ADA4", fontWeight: 600, marginBottom: 8 }}>Current Balance</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 14 }}>{walletBalance}</div>
          <button className={ui.btnPrimary} style={{ width: "100%", textAlign: "center" }}>
            + Add Money
          </button>
        </div>
        <div className={ui.card}>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>Total Spent</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>₹1,42,860</div>
        </div>
        <div className={ui.card}>
          <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>Credits Received</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1E9E5A" }}>₹8,200</div>
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
        {walletTx.map((w, i) => (
          <div key={i} className={ui.tableRow} style={{ gridTemplateColumns: COLS }}>
            <div style={{ fontWeight: 600 }}>{w.desc}</div>
            <div>
              <Badge label={w.type} />
            </div>
            <div style={{ fontWeight: 700, color: w.type === "Credit" ? "#1E9E5A" : "#E4362B" }}>{w.amount}</div>
            <div style={{ color: "var(--muted-strong)" }}>{w.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}
