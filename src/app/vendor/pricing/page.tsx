import ui from "@/components/ui.module.css";
import { fetchVendorPricing } from "@/lib/hooks/usePricing";
import { addVendorPricingItemAction, removeVendorPricingItemAction, updateVendorPricingItemAction } from "@/lib/vendor";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function PricingPage(props: PageProps<"/vendor/pricing">) {
  const params = await props.searchParams;
  const error = toParam(params.error);

  let pricing: Awaited<ReturnType<typeof fetchVendorPricing>> | null = null;
  let loadError: string | null = null;
  try {
    pricing = await fetchVendorPricing();
  } catch {
    loadError = "Couldn't load pricing. Please try again.";
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Pricing</h1>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 16 }}>
        Prices you charge customers for events. These are yours to manage.
      </div>

      {error ? (
        <p style={{ color: "#E4362B", fontSize: 13, marginBottom: 14 }} role="alert">
          {error}
        </p>
      ) : null}

      {loadError ? (
        <div className={ui.card} style={{ color: "var(--muted)" }}>
          {loadError}
        </div>
      ) : (
        <>
          {pricing!.items.length === 0 ? (
            <div className={ui.card} style={{ color: "var(--muted)", marginBottom: 20 }}>
              No pricing set up yet. Add your first price below.
            </div>
          ) : (
            <div className={ui.grid3} style={{ marginBottom: 20 }}>
              {pricing!.items.map((item, i) => (
                <div key={i} className={ui.card} style={{ padding: 18 }}>
                  <form id={`price-form-${i}`} action={updateVendorPricingItemAction.bind(null, i)}>
                    <label className={ui.label} htmlFor={`name-${i}`}>
                      Name
                    </label>
                    <input id={`name-${i}`} name="name" required defaultValue={item.name} className={ui.input} style={{ marginBottom: 10 }} />

                    <div className={ui.grid2}>
                      <div>
                        <label className={ui.label} htmlFor={`price-${i}`}>
                          Price
                        </label>
                        <input
                          id={`price-${i}`}
                          name="price"
                          type="number"
                          min={1}
                          step="0.01"
                          required
                          defaultValue={item.price}
                          className={ui.input}
                          style={{ marginBottom: 10 }}
                        />
                      </div>
                      <div>
                        <label className={ui.label} htmlFor={`currency-${i}`}>
                          Currency
                        </label>
                        <input
                          id={`currency-${i}`}
                          name="currency"
                          defaultValue={item.currency}
                          className={ui.input}
                          style={{ marginBottom: 10 }}
                        />
                      </div>
                    </div>

                    <label className={ui.label} htmlFor={`description-${i}`}>
                      Description
                    </label>
                    <input
                      id={`description-${i}`}
                      name="description"
                      defaultValue={item.description ?? ""}
                      className={ui.input}
                      style={{ marginBottom: 12 }}
                    />

                    <button type="submit" className={ui.btnOutlineSm}>
                      Save
                    </button>
                  </form>
                  <form action={removeVendorPricingItemAction.bind(null, i)} style={{ display: "inline-block", marginLeft: 8 }}>
                    <button type="submit" className={ui.btnOutlineSm} style={{ color: "#E4362B" }}>
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <div className={ui.card} style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Add a Price</div>
            <form action={addVendorPricingItemAction}>
              <label className={ui.label} htmlFor="new-name">
                Name
              </label>
              <input id="new-name" name="name" required placeholder="e.g. Wedding Event" className={ui.input} style={{ marginBottom: 12 }} />

              <div className={ui.grid2}>
                <div>
                  <label className={ui.label} htmlFor="new-price">
                    Price
                  </label>
                  <input
                    id="new-price"
                    name="price"
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    className={ui.input}
                    style={{ marginBottom: 12 }}
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="new-currency">
                    Currency
                  </label>
                  <input id="new-currency" name="currency" defaultValue="INR" className={ui.input} style={{ marginBottom: 12 }} />
                </div>
              </div>

              <label className={ui.label} htmlFor="new-description">
                Description (optional)
              </label>
              <input id="new-description" name="description" className={ui.input} style={{ marginBottom: 14 }} />

              <button type="submit" className={ui.btnPrimary}>
                + Add Price
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
