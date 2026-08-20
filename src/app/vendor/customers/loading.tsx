import ui from "@/components/ui.module.css";

export default function CustomersLoading() {
  return (
    <>
      <h1 className={ui.pageTitle}>Customers</h1>
      <div className={ui.card} style={{ color: "var(--muted)" }}>
        Loading customers…
      </div>
    </>
  );
}
