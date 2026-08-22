"use server";

import { revalidatePath } from "next/cache";
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

export async function updateVendorSettingsAction(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (companyName.length < 2) {
    redirect("/vendor/settings?error=" + encodeURIComponent("Company name must be at least 2 characters"));
  }

  try {
    await apiFetch("/vendors/me", {
      method: "PATCH",
      body: JSON.stringify({
        companyName,
        address: address || null,
      }),
    });
    revalidatePath("/vendor/settings");
    redirect("/vendor/settings?saved=1");
  } catch (err) {
    rethrowRedirect(err);
    const message = err instanceof Error ? err.message : "Could not save settings";
    redirect(`/vendor/settings?error=${encodeURIComponent(message)}`);
  }
}
