"use server";

import { redirect } from "next/navigation";
import { buildThemeContentPayload, extraThemeFields } from "./theme-content-payload";
import { type EventWizardKind, parseWizardKind, wizardBasePath } from "./event-wizard";
import {
  createEventAction,
  createInvitationAction,
  fetchEvent,
  fetchInvitation,
  publishEventAction,
  publishInvitationAction,
  setEventThemeAction,
  setInvitationThemeAction,
  updateEventAction,
  updateInvitationAction,
} from "./server-data";

function q(path: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

function wizardKindFromForm(formData: FormData): EventWizardKind {
  return parseWizardKind(String(formData.get("wizardKind") ?? ""));
}

function wizardRedirect(kind: EventWizardKind, params: Record<string, string | undefined>) {
  redirect(q(wizardBasePath(kind), params));
}

function detailPath(kind: EventWizardKind, id: string) {
  return kind === "invitation" ? `/vendor/invitations/${id}` : `/vendor/events/${id}`;
}

/** Next.js `redirect()` throws; must not be swallowed by try/catch. */
function rethrowRedirect(err: unknown) {
  if (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: string }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw err;
  }
}

function optionalStr(formData: FormData, key: string) {
  const v = String(formData.get(key) ?? "").trim();
  return v || undefined;
}

export async function submitEventDetails(formData: FormData) {
  const kind = wizardKindFromForm(formData);
  const eventName = String(formData.get("eventName") ?? "").trim();
  const eventType = optionalStr(formData, "eventType");
  const eventDate = optionalStr(formData, "eventDate");
  const liveTiming = optionalStr(formData, "liveTiming");
  const location = optionalStr(formData, "location");
  const pageTitle = optionalStr(formData, "pageTitle");
  const coverImage = optionalStr(formData, "coverImage");
  const customerId = optionalStr(formData, "customerId");
  const eventId = optionalStr(formData, "eventId");
  const eventSlug = optionalStr(formData, "eventSlug")
    ?.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (eventName.length < 2) {
    wizardRedirect(kind, { step: "1", eventId, error: "1" });
  }

  try {
    if (kind === "invitation") {
      const payload: Record<string, unknown> = {
        invitationName: eventName,
        ...(eventType ? { eventType } : {}),
        ...(eventDate ? { eventDate } : {}),
        ...(location ? { location } : {}),
        ...(pageTitle ? { pageTitle } : {}),
        ...(coverImage ? { coverImage } : {}),
        ...(customerId ? { customerId } : {}),
      };

      if (eventId) {
        await updateInvitationAction(eventId, payload);
        wizardRedirect(kind, { step: "2", eventId });
      }

      const created = await createInvitationAction(payload);
      wizardRedirect(kind, { step: "2", eventId: created.id });
    }

    const payload: Record<string, unknown> = {
      eventName,
      showWatchLive: true,
      ...(eventType ? { eventType } : {}),
      ...(eventDate ? { eventDate } : {}),
      ...(liveTiming ? { liveTiming } : {}),
      ...(location ? { location } : {}),
      ...(pageTitle ? { pageTitle } : {}),
      ...(coverImage ? { coverImage } : {}),
      ...(customerId ? { customerId } : {}),
      ...(eventSlug ? { eventSlug } : {}),
    };

    if (eventId) {
      await updateEventAction(eventId, payload);
      wizardRedirect(kind, { step: "2", eventId });
    }

    const created = await createEventAction(payload);
    wizardRedirect(kind, { step: "2", eventId: created.id });
  } catch (err) {
    rethrowRedirect(err);
    const message = err instanceof Error ? err.message : "";
    if (/unauthorized|session|token/i.test(message)) {
      redirect("/login?error=session");
    }
    wizardRedirect(kind, { step: "1", eventId, error: "1" });
  }
}

export async function submitThemeStep(formData: FormData) {
  const kind = wizardKindFromForm(formData);
  const eventId = String(formData.get("eventId") ?? "").trim();
  const themeId = optionalStr(formData, "themeId");

  if (!eventId) wizardRedirect(kind, { step: "1", error: "1" });

  try {
    if (themeId) {
      if (kind === "invitation") {
        await setInvitationThemeAction(eventId, { themeId });
        await updateInvitationAction(eventId, { themeId });
      } else {
        await setEventThemeAction(eventId, { themeId });
        await updateEventAction(eventId, { themeId, showWatchLive: true });
      }
    }
  } catch (err) {
    rethrowRedirect(err);
    wizardRedirect(kind, { step: kind === "live" ? "2" : "2", eventId, error: "1" });
  }

  wizardRedirect(kind, { step: kind === "live" ? "3" : "3", eventId });
}

export async function submitThemeContentStep(formData: FormData) {
  const kind = wizardKindFromForm(formData);
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) wizardRedirect(kind, { step: "1", error: "1" });

  try {
    const payload = buildThemeContentPayload(formData, kind);
    const extras = extraThemeFields(formData);
    if (kind === "invitation") {
      await updateInvitationAction(eventId, payload);
      if (
        payload.showSubEvents !== undefined ||
        payload.showInvitationCard !== undefined ||
        Object.keys(extras).length
      ) {
        const invitation = await fetchInvitation(eventId);
        const raw = (invitation?.raw ?? {}) as Record<string, unknown>;
        const themeConfig =
          raw.themeConfig && typeof raw.themeConfig === "object"
            ? (raw.themeConfig as Record<string, unknown>)
            : null;
        const themeId = String(themeConfig?.themeId || raw.themeId || "").trim();
        if (themeId) {
          const prevCustom =
            themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
              ? (themeConfig.customConfig as Record<string, unknown>)
              : {};
          await setInvitationThemeAction(eventId, {
            themeId,
            customConfig: {
              ...prevCustom,
              ...(payload.showSubEvents !== undefined ? { showSubEvents: payload.showSubEvents } : {}),
              ...(payload.showInvitationCard !== undefined
                ? { showInvitationCard: payload.showInvitationCard }
                : {}),
              ...extras,
            },
          });
        }
      }
    } else {
      await updateEventAction(eventId, payload);
      if (
        payload.showSubEvents !== undefined ||
        payload.showInvitationCard !== undefined ||
        Object.keys(extras).length
      ) {
        const event = await fetchEvent(eventId);
        const raw = (event?.raw ?? {}) as Record<string, unknown>;
        const themeConfig =
          raw.themeConfig && typeof raw.themeConfig === "object"
            ? (raw.themeConfig as Record<string, unknown>)
            : null;
        const themeId = String(themeConfig?.themeId || raw.themeId || "").trim();
        if (themeId) {
          const prevCustom =
            themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
              ? (themeConfig.customConfig as Record<string, unknown>)
              : {};
          await setEventThemeAction(eventId, {
            themeId,
            customConfig: {
              ...prevCustom,
              ...(payload.showSubEvents !== undefined ? { showSubEvents: payload.showSubEvents } : {}),
              ...(payload.showInvitationCard !== undefined
                ? { showInvitationCard: payload.showInvitationCard }
                : {}),
              ...extras,
            },
          });
        }
      }
    }
  } catch (err) {
    rethrowRedirect(err);
    wizardRedirect(kind, { step: kind === "live" ? "3" : "3", eventId, error: "1" });
  }

  wizardRedirect(kind, { step: kind === "live" ? "4" : "4", eventId });
}

export async function submitEventPageStep(formData: FormData) {
  const kind = wizardKindFromForm(formData);
  const eventId = String(formData.get("eventId") ?? "").trim();
  const eventSlug = String(formData.get("eventSlug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!eventId) wizardRedirect(kind, { step: "1", error: "1" });
  if (!eventSlug) {
    wizardRedirect(kind, { step: "4", eventId, error: "1" });
  }

  try {
    if (kind === "invitation") {
      await updateInvitationAction(eventId, { invitationSlug: eventSlug });
    } else {
      await updateEventAction(eventId, { eventSlug });
    }
  } catch (err) {
    rethrowRedirect(err);
    wizardRedirect(kind, { step: "4", eventId, error: "1" });
  }

  wizardRedirect(kind, { step: "5", eventId });
}

export async function submitPublishStep(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  const kind = wizardKindFromForm(formData);
  if (!eventId) wizardRedirect(kind, { step: "1", error: "1" });

  try {
    if (kind === "invitation") {
      await publishInvitationAction(eventId);
      redirect(detailPath(kind, eventId));
    } else {
      await publishEventAction(eventId);
      wizardRedirect(kind, { step: "5", eventId });
    }
  } catch (err) {
    rethrowRedirect(err);
    wizardRedirect(kind, { step: kind === "live" ? "4" : "5", eventId, error: "pay" });
  }
}

export async function fetchEventCreationPaymentConfig(
  entityId?: string,
  wizardKind: EventWizardKind = "live"
) {
  const { fetchEventCreationPaymentConfigAction } = await import("./server-data");
  if (wizardKind === "invitation") {
    return fetchEventCreationPaymentConfigAction({ invitationId: entityId });
  }
  return fetchEventCreationPaymentConfigAction({ eventId: entityId });
}

export async function submitQrEventPayment(payload: {
  eventId?: string;
  invitationId?: string;
  utrNumber: string;
  paymentImage: string;
}) {
  const { submitEventCreationPaymentAction } = await import("./server-data");
  return submitEventCreationPaymentAction(payload);
}
