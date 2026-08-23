import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import { CopyLinkButton } from "@/app/vendor/events/new/WizardClient";
import { customerTabs, type CustomerTab } from "@/lib/data";
import { buildCustomerLiveEventHref } from "@/lib/customer-live-event";
import { fetchCustomer } from "@/lib/server-data";

function contentSummary(draft: Record<string, unknown> | null | undefined) {
  if (!draft) return null;
  const parts = [
    draft.brideName && draft.groomName ? `${draft.brideName} & ${draft.groomName}` : draft.brideName || draft.groomName,
    draft.eventDate ? new Date(String(draft.eventDate)).toLocaleDateString("en-IN") : null,
    draft.eventPlace,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

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

  const draft = customer.draftInvitation as Record<string, unknown> | null | undefined;
  const draftRecordKind = draft?.recordKind === "event" ? "event" : "invitation";
  const draftRecordId = String(draft?.id ?? customer.draftInvitationId ?? "");
  const editContentHref = draft
    ? `/vendor/customers/new?step=2&customerId=${encodeURIComponent(customerId)}&kind=${draftRecordKind}${
        draftRecordKind === "event"
          ? `&eventId=${encodeURIComponent(draftRecordId)}`
          : `&invitationId=${encodeURIComponent(draftRecordId)}`
      }`
    : "";
  const shareUrl = typeof draft?.contentFillUrl === "string" ? draft.contentFillUrl : customer.contentFillUrl;
  const summary = contentSummary(draft);
  const hasLiveEvents = customer.events > 0 || customer.eventsList.length > 0;
  const createLiveEventHref =
    draft && draftRecordId && customerId && !hasLiveEvents
      ? buildCustomerLiveEventHref(customerId, draftRecordId, draftRecordKind)
      : null;

  return (
    <>
      <Link href="/vendor/customers" className={ui.backLink}>
        &larr; Back to Customers
      </Link>
      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{customer.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{customer.email}</div>
          {customer.draftInvitationName ? (
            <div style={{ fontSize: 12.5, color: "var(--muted-strong)", marginTop: 4 }}>
              {customer.draftInvitationName}
            </div>
          ) : null}
        </div>
        <div className={ui.row} style={{ gap: 8 }}>
          {customer.contentStatus === "SUBMITTED" ? (
            <Badge label="Content received" size="lg" />
          ) : customer.contentStatus === "AWAITING_CONTENT" ? (
            <Badge label="Awaiting content" size="lg" />
          ) : (
            <Badge label={customer.status} size="lg" />
          )}
          {draft ? (
            <Link
              href={editContentHref}
              className={ui.btnOutlineSm}
              style={{ textDecoration: "none" }}
            >
              Edit content
            </Link>
          ) : null}
        </div>
      </div>

      {shareUrl ? (
        <div className={ui.card} style={{ marginBottom: 16, padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Customer fill link</div>
          <p style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 10 }}>
            Share this URL so the customer can enter invitation details.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <code style={{ fontSize: 12, wordBreak: "break-all", flex: 1 }}>{shareUrl}</code>
            <CopyLinkButton value={shareUrl} />
          </div>
        </div>
      ) : null}

      <LinkTabs
        active={activeTab}
        items={customerTabs.map((t) => ({ label: t, href: `/vendor/customers/${customerId}?tab=${t}` }))}
      />

      {activeTab === "Overview" && (
        <div className={ui.grid3}>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Content status</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {customer.contentStatus === "SUBMITTED"
                ? "Received"
                : customer.contentStatus === "AWAITING_CONTENT"
                  ? "Waiting for customer"
                  : customer.contentStatus === "THEME_PENDING"
                    ? "Theme pending"
                    : "—"}
            </div>
            {summary ? (
              <div style={{ fontSize: 12.5, color: "var(--muted-strong)", marginTop: 8 }}>{summary}</div>
            ) : null}
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Total Events</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{customer.events}</div>
          </div>
          <div className={ui.card}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Joined</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{customer.joined}</div>
          </div>
        </div>
      )}

      {activeTab === "Events" && (
        <>
          {createLiveEventHref ? (
            <div
              className={ui.card}
              style={{
                marginBottom: 16,
                padding: "16px 20px",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Create live event</div>
                <div style={{ fontSize: 13, color: "var(--muted-strong)" }}>
                  Turn this customer&apos;s invitation into a live event. Theme selection is skipped;
                  theme content is copied and shown on the next step for review.
                </div>
              </div>
              <Link href={createLiveEventHref} className={ui.btnPrimary} style={{ textDecoration: "none" }}>
                Create Live Event
              </Link>
            </div>
          ) : null}
          <div className={ui.cardTight}>
            {customer.eventsList.length === 0 ? (
              <div style={{ padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>
                No live events for this customer yet.
              </div>
            ) : (
              customer.eventsList.map((ev) => (
                <div
                  key={ev._id ?? ev.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-soft)",
                    fontSize: 13,
                  }}
                >
                  {ev._id ? (
                    <Link
                      href={`/vendor/events/${ev._id}`}
                      style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}
                    >
                      {ev.name}
                    </Link>
                  ) : (
                    <div style={{ fontWeight: 600 }}>{ev.name}</div>
                  )}
                  <div style={{ color: "var(--muted-strong)" }}>{ev.date}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}

    </>
  );
}
