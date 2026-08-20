import Link from "next/link";
import { notFound } from "next/navigation";
import ui from "@/components/ui.module.css";
import { fetchCustomerDetail } from "@/lib/hooks/useCustomers";
import { updateCustomerAction } from "@/lib/customers";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EditCustomerPage(props: PageProps<"/vendor/customers/[id]/edit">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const error = toParam(params.error);

  const detail = await fetchCustomerDetail(id);
  if (!detail) notFound();
  const { customer } = detail;

  return (
    <>
      <Link href={`/vendor/customers/${id}`} className={ui.backLink}>
        &larr; Back to Customer
      </Link>
      <h1 className={ui.pageTitle}>Edit Customer</h1>

      <div className={ui.card} style={{ maxWidth: 480 }}>
        <form action={updateCustomerAction.bind(null, id)}>
          <label className={ui.label} htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            defaultValue={customer.name}
            className={ui.input}
            style={{ marginBottom: 14 }}
          />

          <label className={ui.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={customer.email ?? ""}
            className={ui.input}
            style={{ marginBottom: 14 }}
          />

          <label className={ui.label} htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={customer.phone ?? ""}
            className={ui.input}
            style={{ marginBottom: 14 }}
          />

          {error ? (
            <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 14 }} role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className={ui.btnPrimary}>
            Save Changes
          </button>
        </form>
      </div>
    </>
  );
}
