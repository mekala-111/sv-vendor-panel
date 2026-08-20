import Link from "next/link";
import { Badge } from "@/components/Badge";
import ui from "@/components/ui.module.css";
import { fetchCustomers, type CustomerStatus } from "@/lib/hooks/useCustomers";
import styles from "./page.module.css";

const COLS = "1.8fr 1.1fr 1fr 0.8fr 0.9fr";
const STATUSES: CustomerStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function CustomersPage(props: PageProps<"/vendor/customers">) {
  const params = await props.searchParams;
  const search = toParam(params.search);
  const status = toParam(params.status) as CustomerStatus | "";
  const page = Math.max(1, Number(toParam(params.page)) || 1);

  let result: Awaited<ReturnType<typeof fetchCustomers>> | null = null;
  let loadError: string | null = null;
  try {
    result = await fetchCustomers({ page, search, status });
  } catch {
    loadError = "Couldn't load customers. Please try again.";
  }

  const buildHref = (overrides: Record<string, string | number>) => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (status) next.set("status", status);
    if (page > 1) next.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === "" || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    const qs = next.toString();
    return qs ? `/vendor/customers?${qs}` : "/vendor/customers";
  };

  return (
    <>
      <h1 className={ui.pageTitle}>Customers</h1>

      <form className={styles.filters} method="get">
        <input
          type="text"
          name="search"
          placeholder="Search by name, email, phone…"
          defaultValue={search}
          className={ui.input}
          style={{ maxWidth: 280 }}
        />
        <select name="status" defaultValue={status} className={ui.input} style={{ maxWidth: 180 }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <button type="submit" className={ui.btnOutline}>
          Filter
        </button>
        <Link href="/vendor/customers/new" className={ui.btnPrimary} style={{ marginLeft: "auto" }}>
          + Add Customer
        </Link>
      </form>

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <>
          <div className={ui.cardTight}>
            <div className={ui.tableHead} style={{ gridTemplateColumns: COLS }}>
              <div>CUSTOMER</div>
              <div>PHONE</div>
              <div>EVENTS</div>
              <div>STATUS</div>
              <div>JOINED</div>
            </div>
            {result!.items.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>
                {search || status ? "No customers match your search." : "No customers yet. Add your first customer to get started."}
              </div>
            ) : (
              result!.items.map((c) => (
                <Link
                  key={c.id}
                  href={`/vendor/customers/${c.id}`}
                  className={`${ui.tableRow} ${ui.rowLink}`}
                  style={{ gridTemplateColumns: COLS, color: "inherit" }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.email}</div>
                  </div>
                  <div>{c.phone || "–"}</div>
                  <div>{c.eventsCount}</div>
                  <div>
                    <Badge label={c.status.charAt(0) + c.status.slice(1).toLowerCase()} />
                  </div>
                  <div style={{ color: "var(--muted-strong)" }}>
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                </Link>
              ))
            )}
          </div>

          {result!.totalPages > 1 && (
            <div className={styles.pagination}>
              <Link
                href={buildHref({ page: page - 1 })}
                className={ui.btnOutlineSm}
                aria-disabled={page <= 1}
                style={page <= 1 ? { pointerEvents: "none", opacity: 0.5 } : undefined}
              >
                ← Previous
              </Link>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Page {result!.page} of {result!.totalPages} · {result!.total} customers
              </span>
              <Link
                href={buildHref({ page: page + 1 })}
                className={ui.btnOutlineSm}
                aria-disabled={page >= result!.totalPages}
                style={page >= result!.totalPages ? { pointerEvents: "none", opacity: 0.5 } : undefined}
              >
                Next →
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
