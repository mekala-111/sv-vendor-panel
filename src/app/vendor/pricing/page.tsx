import ui from "@/components/ui.module.css";
import { vendorPricing } from "@/lib/data";

export default function PricingPage() {
  return (
    <>
      <h1 className={ui.pageTitle}>Pricing</h1>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}>
        Event pricing assigned to your account by SV Live.
      </div>
      <div className={ui.grid4}>
        {vendorPricing.map((pr) => (
          <div key={pr.name} className={ui.card} style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{pr.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>{pr.price}</div>
          </div>
        ))}
      </div>
    </>
  );
}
