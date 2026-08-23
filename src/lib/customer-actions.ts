"use server";

import { redirect } from "next/navigation";
import {
  fetchEvent,
  fetchInvitation,
  setEventThemeAction,
  setInvitationThemeAction,
  setupCustomerDraftAction,
  updateEventAction,
  updateInvitationAction,
} from "@/lib/server-data";
import type { CustomerContentRecordKind } from "@/lib/server-data";
import { buildThemeContentPayload } from "@/lib/theme-content-payload";

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

export async function submitCustomerSetupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const invitationName = String(formData.get("invitationName") ?? "").trim();
  const themeId = String(formData.get("themeId") ?? "").trim();

  if (!name || !email || !invitationName || !themeId) {
    redirect("/vendor/customers/new?step=1&error=1");
  }

  try {
    const result = await setupCustomerDraftAction({
      name,
      email,
      phone: phone || undefined,
      invitationName,
      themeId,
    });
    const customerId = result.customer?.id ?? result.customer?._id;
    const recordId = result.invitation?.id ?? result.invitation?._id;
    const recordKind = result.recordKind ?? "invitation";
    if (!customerId || !recordId) {
      redirect("/vendor/customers/new?step=1&error=1");
    }
    const params = new URLSearchParams({
      step: "2",
      customerId,
      kind: recordKind,
    });
    if (recordKind === "event") {
      params.set("eventId", recordId);
    } else {
      params.set("invitationId", recordId);
    }
    redirect(`/vendor/customers/new?${params.toString()}`);
  } catch (err) {
    rethrowRedirect(err);
    const message =
      err instanceof Error && err.message.trim()
        ? err.message.trim()
        : "Something went wrong. Check the details and try again.";
    const errorFlag =
      /email already in use/i.test(message) ? "email_in_use" : "1";
    redirect(
      `/vendor/customers/new?step=1&error=${errorFlag}&msg=${encodeURIComponent(message.slice(0, 240))}`
    );
  }
}

export async function saveCustomerThemeContentAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const recordKind = String(formData.get("recordKind") ?? "invitation").trim() as CustomerContentRecordKind;
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const eventId = String(formData.get("eventId") ?? "").trim();
  const recordId = recordKind === "event" ? eventId : invitationId;
  if (!customerId || !recordId) redirect("/vendor/customers/new?step=1");

  const step2Params = new URLSearchParams({
    step: "2",
    customerId,
    kind: recordKind,
  });
  if (recordKind === "event") {
    step2Params.set("eventId", recordId);
  } else {
    step2Params.set("invitationId", recordId);
  }

  try {
    const payload = buildThemeContentPayload(formData);
    const contentMeta =
      recordKind === "invitation"
        ? {
            contentFilledBy: "VENDOR",
            contentFilledAt: new Date().toISOString(),
          }
        : {};

    if (recordKind === "event") {
      await updateEventAction(recordId, { ...payload, ...contentMeta });
    } else {
      await updateInvitationAction(recordId, { ...payload, ...contentMeta });
    }

    const record =
      recordKind === "event" ? await fetchEvent(recordId) : await fetchInvitation(recordId);
    const raw = (record?.raw ?? {}) as Record<string, unknown>;
    const themeConfig =
      raw.themeConfig && typeof raw.themeConfig === "object"
        ? (raw.themeConfig as Record<string, unknown>)
        : null;
    const themeId = String(themeConfig?.themeId || raw.themeId || "").trim();
    if (
      themeId &&
      (payload.showSubEvents !== undefined || payload.showInvitationCard !== undefined)
    ) {
      const prevCustom =
        themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
          ? (themeConfig.customConfig as Record<string, unknown>)
          : {};
      const themePayload = {
        themeId,
        customConfig: {
          ...prevCustom,
          ...(payload.showSubEvents !== undefined ? { showSubEvents: payload.showSubEvents } : {}),
          ...(payload.showInvitationCard !== undefined
            ? { showInvitationCard: payload.showInvitationCard }
            : {}),
        },
      };
      if (recordKind === "event") {
        await setEventThemeAction(recordId, themePayload);
      } else {
        await setInvitationThemeAction(recordId, themePayload);
      }
    }
  } catch (err) {
    rethrowRedirect(err);
    step2Params.set("error", "1");
    redirect(`/vendor/customers/new?${step2Params.toString()}`);
  }
  redirect(`/vendor/customers/${customerId}?tab=Overview&saved=1`);
}
