import Link from "next/link";
import ui from "@/components/ui.module.css";
import { createCustomerAction } from "@/lib/customers";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function NewCustomerPage(props: PageProps<"/vendor/customers/new">) {
  const params = await props.searchParams;
  const error = toParam(params.error);

  return (
    <>
      <Link href="/vendor/customers" className={ui.backLink}>
        &larr; Back to Customers
      </Link>
      <h1 className={ui.pageTitle}>Add Customer</h1>

      <div className={ui.card} style={{ maxWidth: 480 }}>
        <form action={createCustomerAction}>
          <label className={ui.label} htmlFor="name">
            Full name
          </label>
          <input id="name" name="name" required minLength={2} className={ui.input} style={{ marginBottom: 14 }} />

          <label className={ui.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={ui.input}
            style={{ marginBottom: 14 }}
          />

          <label className={ui.label} htmlFor="phone">
            Phone (optional)
          </label>
          <input id="phone" name="phone" type="tel" className={ui.input} style={{ marginBottom: 14 }} />

          <label className={ui.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={ui.input}
            style={{ marginBottom: 14 }}
          />

          <label className={ui.label} htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={ui.input}
            style={{ marginBottom: 14 }}
          />

          {error ? (
            <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 14 }} role="alert">
              {error}
            </p>
          ) : null}

          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            This creates a login for the customer too — they can sign in with this email and password.
          </p>

          <button type="submit" className={ui.btnPrimary}>
            Create Customer
          </button>
        </form>
      </div>
    </>
  );
}
