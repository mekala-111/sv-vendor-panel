import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { customerTabs, type CustomerTab } from "@/lib/data";
import { fetchCustomerDetail } from "@/lib/hooks/useCustomers";
import { setCustomerStatusAction } from "@/lib/customers";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function formatDate(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function CustomerDetailPage(props: PageProps<"/vendor/customers/[id]">) {
  const { id } = await props.params;
  const { tab } = await props.searchParams;

  const detail = await fetchCustomerDetail(id);
  if (!detail) notFound();

  const { customer, stats, events, payments, activity } = detail;

  const selected = toParam(tab);
  const activeTab = (customerTabs as readonly string[]).includes(selected) ? (selected as CustomerTab) : "Overview";

  const isActive = customer.status === "ACTIVE";
  const nextStatus = isActive ? "INACTIVE" : "ACTIVE";

  return (
    <>
      <Link href="/vendor/customers" className={ui.backLink}>
        &larr; Back to Customers
      </Link>
      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{customer.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {customer.email} {customer.phone ? `· ${customer.phone}` : ""} · {customer.customerCode}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge label={statusLabel(customer.status)} size="lg" />
          <Link href={`/vendor/customers/${customer.id}/edit`} className={ui.btnOutlineSm}>
            Edit
          </Link>
          <form action={setCustomerStatusAction.bind(null, customer.id, nextStatus)}>
            <button type="submit" className={isActive ? ui.btnDanger : ui.btnPrimary}>
              {isActive ? "Deactivate" : "Activate"}
            </button>
          </form>
        </div>
      </div>

      <LinkTabs
        active={activeTab}
        items={customerTabs.map((t) => ({ label: t, href: `/vendor/customers/${customer.id}?tab=${t}` }))}
      />

      {activeTab === "Overview" && (
        <div className={ui.grid3}>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Total Events</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.totalEvents}</div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Upcoming / Completed</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {stats.upcomingEvents} / {stats.completedEvents}
            </div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Joined</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{formatDate(customer.createdAt)}</div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Total Paid</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>₹{stats.totalSpend.toLocaleString("en-IN")}</div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Pending Payments</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>₹{stats.pendingSpend.toLocaleString("en-IN")}</div>
          </div>
        </div>
      )}

      {activeTab === "Events" && (
        <div className={ui.cardTight}>
          {events.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)" }}>No events yet</div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-soft)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600 }}>{ev.eventName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ color: "var(--muted-strong)" }}>{formatDate(ev.eventDate)}</div>
                  <Badge label={statusLabel(ev.status)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Payments" && (
        <div className={ui.cardTight}>
          {payments.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)" }}>No payments yet</div>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-soft)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600 }}>₹{Number(p.amount).toLocaleString("en-IN")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ color: "var(--muted-strong)" }}>{formatDate(p.paidAt ?? p.createdAt)}</div>
                  <Badge label={statusLabel(p.status)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Activity" && (
        <div className={ui.cardTight}>
          {activity.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)" }}>No activity yet</div>
          ) : (
            activity.map((ac, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13 }}>
                <div>{ac.text}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{formatDate(ac.time)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
