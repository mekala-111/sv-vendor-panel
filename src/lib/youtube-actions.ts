"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "./api";

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

export async function connectYoutubeAction() {
  try {
    const { data } = await apiFetch<{ authUrl: string }>("/youtube/connect", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!data?.authUrl) {
      redirect("/vendor/youtube?error=" + encodeURIComponent("Connect URL was not returned"));
    }
    redirect(data.authUrl);
  } catch (err) {
    rethrowRedirect(err);
    const message = err instanceof Error ? err.message : "Could not start YouTube connect";
    redirect(`/vendor/youtube?error=${encodeURIComponent(message)}`);
  }
}

export async function addYoutubeChannelManualAction(formData: FormData) {
  const channelName = String(formData.get("channelName") ?? "").trim();
  const channelId = String(formData.get("channelId") ?? "").trim();

  if (channelName.length < 2 || channelId.length < 3) {
    redirect("/vendor/youtube?error=" + encodeURIComponent("Channel name and ID are required"));
  }

  try {
    await apiFetch("/youtube/channels/manual", {
      method: "POST",
      body: JSON.stringify({ channelName, channelId }),
    });
  } catch (err) {
    rethrowRedirect(err);
    const message = err instanceof Error ? err.message : "Could not add channel";
    redirect(`/vendor/youtube?error=${encodeURIComponent(message)}`);
  }
  redirect("/vendor/youtube?connected=1");
}

export async function disconnectYoutubeAction(formData: FormData) {
  const id = String(formData.get("channelId") ?? "").trim();
  if (!id) redirect("/vendor/youtube?error=missing");

  try {
    await apiFetch(`/youtube/disconnect/${id}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch (err) {
    rethrowRedirect(err);
    const message = err instanceof Error ? err.message : "Could not disconnect channel";
    redirect(`/vendor/youtube?error=${encodeURIComponent(message)}`);
  }
  redirect("/vendor/youtube?disconnected=1");
}
