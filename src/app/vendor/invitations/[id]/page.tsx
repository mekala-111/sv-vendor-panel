import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LinkTabs } from "@/components/LinkTabs";
import ui from "@/components/ui.module.css";
import {
  saveInvitationAccessAction,
  saveInvitationPageAction,
  saveInvitationThemeContentAction,
} from "@/lib/invitation-detail-actions";
import { ThemeContentEditor } from "@/app/vendor/events/ThemeContentEditor";
import type { VendorThemePreview } from "@/lib/theme-preview-payload";
import { resolveThemeFields } from "@/lib/theme-config";
import styles from "@/app/vendor/events/new/wizard.module.css";
import {
  fetchEventCreationPayment,
  fetchInvitation,
  fetchThemes,
} from "@/lib/server-data";
import {
  buildPublicInvitationPathUrl,
  getConfiguredPublicEventBase,
} from "@/lib/public-event-url";
import { PreviewEventButton } from "@/components/PreviewEventButton";
import { InvitationShareButton } from "./InvitationShareButton";

const PUBLIC_BASE = getConfiguredPublicEventBase();
const TABS = ["Overview", "Theme Content", "Invitation Page", "Settings"] as const;
type InvitationTab = (typeof TABS)[number];

function tabBanner(saved?: string, error?: string) {
  if (saved) {
    return (
      <div style={{ marginBottom: 14, fontSize: 13, color: "#1E9E5A", fontWeight: 700 }}>
        Saved successfully.
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ marginBottom: 14, fontSize: 13, color: "#E4362B", fontWeight: 700 }}>
        Could not save. Please try again.
      </div>
    );
  }
  return null;
}

export default async function InvitationDetailPage(props: PageProps<"/vendor/invitations/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const selected = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const saved = Array.isArray(searchParams.saved) ? searchParams.saved[0] : searchParams.saved;
  const error = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  const invitation = await fetchInvitation(id);
  if (!invitation) notFound();

  const invitationId = invitation._id ?? id;
  const raw = invitation.raw;
  const activeTab = (TABS as readonly string[]).includes(selected ?? "")
    ? (selected as InvitationTab)
    : "Overview";

  const publicUrl = buildPublicInvitationPathUrl(PUBLIC_BASE, raw.eventSlug || "");
  const isLive = Boolean(raw.isPublished);
  const [themes, feePayment] = await Promise.all([
    activeTab === "Theme Content" || activeTab === "Overview"
      ? fetchThemes()
      : Promise.resolve([]),
    fetchEventCreationPayment(invitationId, "invitation"),
  ]);

  const access = raw.access;
  const themeConfig = raw.themeConfig;
  const currentThemeId = themeConfig?.themeId || raw.themeId;
  const appliedTheme = themes.find((t) => t._id === currentThemeId);
  const themeContentFields = resolveThemeFields(appliedTheme ?? null);
  const paymentRejected = feePayment?.status === "FAILED";
  const paymentPending = feePayment?.status === "PENDING";
  const paymentSuccess = feePayment?.status === "SUCCESS";

  return (
    <>
      <Link href="/vendor/invitations" className={ui.backLink}>
        &larr; Back to Invitations
      </Link>
      <div className={`${ui.card} ${ui.row}`} style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{invitation.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {invitation.date}, {invitation.time} · {invitation.location}
          </div>
        </div>
        <div className={ui.row} style={{ justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <Badge label={invitation.status} size="lg" />
          <InvitationShareButton
            invitationSlug={raw.eventSlug}
            invitationName={raw.pageTitle || raw.eventName || invitation.name}
            brideName={(raw as { brideName?: string | null }).brideName}
            groomName={(raw as { groomName?: string | null }).groomName}
            coverImage={(raw as { coverImage?: string | null }).coverImage}
            invitationCard={(raw as { invitationCard?: string | null }).invitationCard}
            whatsappImage={(raw as { whatsappImage?: string | null }).whatsappImage}
            isPublished={isLive}
          />
          {isLive && publicUrl ? (
            <a
              className={ui.btnDanger}
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              OPEN INVITATION
            </a>
          ) : paymentRejected ? (
            <Link
              className={ui.btnDanger}
              href={`/vendor/invitations/new?step=5&eventId=${encodeURIComponent(invitationId)}`}
              style={{ textDecoration: "none" }}
            >
              RESUBMIT PAYMENT
            </Link>
          ) : paymentPending ? (
            <span className={ui.btnOutlineSm} style={{ opacity: 0.85, cursor: "default" }}>
              AWAITING PAYMENT APPROVAL
            </span>
          ) : (
            <Link
              className={ui.btnDanger}
              href={`/vendor/invitations/new?step=5&eventId=${encodeURIComponent(invitationId)}`}
              style={{ textDecoration: "none" }}
            >
              COMPLETE PAYMENT
            </Link>
          )}
        </div>
      </div>

      <LinkTabs
        active={activeTab}
        size="sm"
        items={TABS.map((t) => ({
          label: t,
          href: `/vendor/invitations/${invitationId}?tab=${encodeURIComponent(t)}`,
        }))}
      />

      <div className={ui.card}>
        {tabBanner(saved, error)}

        {activeTab === "Overview" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 12 }}>
              Invitation overview
            </div>
            <div className={ui.grid2} style={{ marginBottom: 16 }}>
              <div>
                <div className={ui.label}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{invitation.status}</div>
              </div>
              <div>
                <div className={ui.label}>Published</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.isPublished ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className={ui.label}>Payment</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {paymentSuccess
                    ? "Verified"
                    : paymentPending
                      ? "Pending approval"
                      : paymentRejected
                        ? "Rejected"
                        : "Not submitted"}
                </div>
              </div>
              <div>
                <div className={ui.label}>Type</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.eventType || "—"}</div>
              </div>
              <div>
                <div className={ui.label}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{invitation.customer}</div>
              </div>
              <div>
                <div className={ui.label}>Invitation code</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{raw.eventCode || "—"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {isLive && publicUrl ? (
                <a className={ui.btnOutlineSm} href={publicUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  Open invitation
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "Theme Content" ? (
          <div className={styles.themeContentTab}>
            {!currentThemeId ? (
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                No theme assigned yet. Assign a theme when creating the invitation.
              </p>
            ) : (
              <ThemeContentEditor
                eventId={invitationId}
                fields={themeContentFields}
                raw={raw as Record<string, unknown>}
                theme={appliedTheme as VendorThemePreview | null}
                formAction={saveInvitationThemeContentAction}
                title="Theme content"
                submitLabel="Save content"
                description={`Invitation content for ${appliedTheme?.name ?? "your theme"}.`}
                banner={tabBanner(saved, error)}
              />
            )}
          </div>
        ) : null}

        {activeTab === "Invitation Page" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Public invitation page
            </div>
            <form action={saveInvitationPageAction} style={{ display: "grid", gap: 14, maxWidth: 480 }}>
              <input type="hidden" name="invitationId" value={invitationId} />
              <div>
                <label className={ui.label} htmlFor="invitationSlug">
                  Public slug
                </label>
                <input
                  className={ui.inputMono}
                  id="invitationSlug"
                  name="invitationSlug"
                  defaultValue={raw.eventSlug || ""}
                  disabled={Boolean(raw.isPublished)}
                />
              </div>
              <div>
                <label className={ui.label} htmlFor="pageTitle">
                  Page title
                </label>
                <input
                  className={ui.input}
                  id="pageTitle"
                  name="pageTitle"
                  defaultValue={raw.pageTitle || raw.eventName || ""}
                />
              </div>
              {isLive && publicUrl ? (
                <div style={{ fontSize: 13 }}>
                  Live URL:{" "}
                  <a href={publicUrl} target="_blank" rel="noreferrer" className={ui.link}>
                    {publicUrl}
                  </a>
                </div>
              ) : null}
              {!isLive && raw.eventSlug ? (
                <PreviewEventButton eventId={invitationId} kind="invitation" />
              ) : null}
              <button type="submit" className={ui.btnPrimary} style={{ justifySelf: "start" }}>
                Save page settings
              </button>
            </form>
          </div>
        ) : null}

        {activeTab === "Settings" ? (
          <div>
            <div className={ui.sectionTitle} style={{ marginBottom: 8 }}>
              Access &amp; visibility
            </div>
            <form action={saveInvitationAccessAction} style={{ display: "grid", gap: 14, maxWidth: 480 }}>
              <input type="hidden" name="invitationId" value={invitationId} />
              <div>
                <label className={ui.label} htmlFor="accessType">
                  Access type
                </label>
                <select
                  className={ui.input}
                  id="accessType"
                  name="accessType"
                  defaultValue={access?.accessType || "PUBLIC"}
                >
                  <option value="PUBLIC">Public — anyone with the link</option>
                  <option value="PRIVATE">Private — password required</option>
                </select>
              </div>
              <div>
                <label className={ui.label} htmlFor="password">
                  Password (required for private)
                </label>
                <input className={ui.input} id="password" name="password" type="password" minLength={4} placeholder="••••••••" />
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, fontWeight: 600 }}>
                <input type="checkbox" name="isEnabled" defaultChecked={access?.isEnabled !== false} />
                Access enabled
              </label>
              <button type="submit" className={ui.btnPrimary} style={{ justifySelf: "start" }}>
                Save settings
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
