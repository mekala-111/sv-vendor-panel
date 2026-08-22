import Link from "next/link";
import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchCustomers } from "@/lib/server-data";

const COLS = "1.8fr 1fr 1.2fr 1fr";

export default async function CustomersPage() {
  const customers = await fetchCustomers();

  return (
    <>
      <h1 className={ui.pageTitle}>Customers</h1>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <button className={ui.btnPrimary}>+ Add Customer</button>
      </div>
      <div className={ui.cardTight}>
        <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
          <div>CUSTOMER</div>
          <div>EVENTS</div>
          <div>TOTAL SPEND</div>
          <div>STATUS</div>
        </div>
        {customers.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
            No customers yet.
          </div>
        ) : (
          customers.map((c) => (
            <Link
              key={c._id ?? c.id}
              href={`/vendor/customers/${c._id ?? c.id}`}
              className={`${ui.tableRow} ${ui.rowLink}`}
              style={{ gridTemplateColumns: COLS, color: "inherit" }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.email}</div>
              </div>
              <div>{c.events}</div>
              <div style={{ fontWeight: 600 }}>{c.spend}</div>
              <div>
                <Badge label={c.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
