"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  fetchInvitation,
  setInvitationThemeAction,
  updateInvitationAction,
} from "@/lib/server-data";
import { buildThemeContentPayload, extraThemeFields } from "@/lib/theme-content-payload";

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

async function persistInvitationSectionToggles(
  invitationId: string,
  payload: Record<string, unknown>,
  extras: Record<string, unknown> = {}
) {
  const patch = {
    ...(payload.showSubEvents !== undefined ? { showSubEvents: payload.showSubEvents } : {}),
    ...(payload.showInvitationCard !== undefined
      ? { showInvitationCard: payload.showInvitationCard }
      : {}),
    ...extras,
  };
  if (!Object.keys(patch).length) {
    return;
  }
  const invitation = await fetchInvitation(invitationId);
  const raw = (invitation?.raw ?? {}) as Record<string, unknown>;
  const themeConfig =
    raw.themeConfig && typeof raw.themeConfig === "object"
      ? (raw.themeConfig as Record<string, unknown>)
      : null;
  const themeId = String(themeConfig?.themeId || raw.themeId || "").trim();
  if (!themeId) return;

  const prevCustom =
    themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
      ? (themeConfig.customConfig as Record<string, unknown>)
      : {};

  await setInvitationThemeAction(invitationId, {
    themeId,
    customConfig: {
      ...prevCustom,
      ...patch,
    },
  });
}

export async function saveInvitationAccessAction(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const accessType = String(formData.get("accessType") ?? "PUBLIC").trim().toUpperCase();
  const password = String(formData.get("password") ?? "").trim();
  const isEnabled = formData.get("isEnabled") === "on";

  if (!invitationId) redirect("/vendor/invitations");

  try {
    await apiFetch(`/invitations/${invitationId}/access`, {
      method: "PUT",
      body: JSON.stringify({
        accessType: accessType === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        isEnabled,
        ...(accessType === "PRIVATE" && password ? { password } : {}),
      }),
    });
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/invitations/${invitationId}?tab=Settings&error=1`);
  }
  redirect(`/vendor/invitations/${invitationId}?tab=Settings&saved=1`);
}

export async function assignInvitationThemeAction(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const themeId = String(formData.get("themeId") ?? "").trim();
  if (!invitationId) redirect("/vendor/invitations");

  try {
    if (themeId) {
      await setInvitationThemeAction(invitationId, { themeId });
      await updateInvitationAction(invitationId, { themeId });
    }
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/invitations/${invitationId}?tab=Theme&error=1`);
  }
  redirect(`/vendor/invitations/${invitationId}?tab=Theme&saved=1`);
}

export async function saveInvitationPageAction(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const invitationSlug = String(formData.get("invitationSlug") ?? "").trim().toLowerCase();
  const pageTitle = String(formData.get("pageTitle") ?? "").trim();
  if (!invitationId) redirect("/vendor/invitations");

  try {
    await updateInvitationAction(invitationId, {
      ...(invitationSlug ? { invitationSlug } : {}),
      ...(pageTitle ? { pageTitle } : {}),
    });
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/invitations/${invitationId}?tab=Invitation%20Page&error=1`);
  }
  redirect(`/vendor/invitations/${invitationId}?tab=Invitation%20Page&saved=1`);
}

export async function saveInvitationThemeContentAction(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? formData.get("eventId") ?? "").trim();
  if (!invitationId) redirect("/vendor/invitations");

  try {
    const payload = buildThemeContentPayload(formData);
    await updateInvitationAction(invitationId, payload);
    await persistInvitationSectionToggles(invitationId, payload, extraThemeFields(formData));
  } catch (err) {
    rethrowRedirect(err);
    redirect(`/vendor/invitations/${invitationId}?tab=Theme%20Content&error=1`);
  }
  redirect(`/vendor/invitations/${invitationId}?tab=Theme%20Content&saved=1`);
}
