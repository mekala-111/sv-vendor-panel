import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { customerTabs, type CustomerTab } from "@/lib/data";
import { fetchCustomer } from "@/lib/server-data";

export default async function CustomerDetailPage(props: PageProps<"/vendor/customers/[id]">) {
  const { id } = await props.params;
  const { tab } = await props.searchParams;
  const customer = await fetchCustomer(id);
  if (!customer) notFound();

  const customerId = customer._id ?? id;
  const selected = Array.isArray(tab) ? tab[0] : tab;
  const activeTab = (customerTabs as readonly string[]).includes(selected ?? "")
    ? (selected as CustomerTab)
    : "Overview";

  return (
    <>
      <Link href="/vendor/customers" className={ui.backLink}>
        &larr; Back to Customers
      </Link>
      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{customer.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{customer.email}</div>
        </div>
        <Badge label={customer.status} size="lg" />
      </div>

      <LinkTabs
        active={activeTab}
        items={customerTabs.map((t) => ({ label: t, href: `/vendor/customers/${customerId}?tab=${t}` }))}
      />

      {activeTab === "Overview" && (
        <div className={ui.grid3}>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Total Events</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{customer.events}</div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Total Spend</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{customer.spend}</div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Joined</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{customer.joined}</div>
          </div>
        </div>
      )}

      {activeTab === "Events" && (
        <div className={ui.cardTight}>
          {customer.eventsList.length === 0 ? (
            <div style={{ padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>No events for this customer.</div>
          ) : (
            customer.eventsList.map((ev, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-soft)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600 }}>{ev.name}</div>
                <div style={{ color: "var(--muted-strong)" }}>{ev.date}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Payments" && (
        <div className={ui.cardTight}>
          {customer.paymentsList.length === 0 ? (
            <div style={{ padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>No payments yet.</div>
          ) : (
            customer.paymentsList.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-soft)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.desc}</div>
                <div style={{ fontWeight: 700 }}>{p.amount}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Activity" && (
        <div className={ui.cardTight}>
          {customer.activity.length === 0 ? (
            <div style={{ padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>No activity yet.</div>
          ) : (
            customer.activity.map((ac, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13 }}>
                <div>{ac.text}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{ac.time}</div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
