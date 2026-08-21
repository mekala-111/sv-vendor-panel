"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";
import { fetchVendorPricing, type PricingItem } from "./hooks/usePricing";

function errorRedirect(to: string, message: string): never {
  redirect(`${to}?error=${encodeURIComponent(message)}`);
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateVendorProfileAction(formData: FormData) {
  const companyName = str(formData, "companyName");
  if (companyName.length < 2) errorRedirect("/vendor/settings", "Company name must be at least 2 characters.");

  const phone = str(formData, "phone");
  const email = str(formData, "email");
  const address = str(formData, "address");
  const whatsappNumber = str(formData, "whatsappNumber");
  const whatsappEnabled = formData.get("whatsappEnabled") === "on";

  try {
    await api.patch("/vendors/me", {
      companyName,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      whatsappNumber: whatsappNumber || undefined,
      whatsappEnabled,
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update settings.";
    errorRedirect("/vendor/settings", message);
  }

  revalidatePath("/vendor/settings");
  revalidatePath("/vendor");
  redirect("/vendor/settings?saved=1");
}

export async function updateVendorBrandingAction(formData: FormData) {
  const primaryColor = str(formData, "primaryColor");
  const secondaryColor = str(formData, "secondaryColor");
  const accentColor = str(formData, "accentColor");
  const logo = str(formData, "logo");
  const favicon = str(formData, "favicon");
  const customDomain = str(formData, "customDomain");
  const supportEmail = str(formData, "supportEmail");

  try {
    await api.patch("/vendors/me/branding", {
      ...(primaryColor ? { primaryColor } : {}),
      ...(secondaryColor ? { secondaryColor } : {}),
      ...(accentColor ? { accentColor } : {}),
      ...(logo ? { logo } : {}),
      ...(favicon ? { favicon } : {}),
      ...(customDomain ? { customDomain } : {}),
      ...(supportEmail ? { supportEmail } : {}),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update branding.";
    errorRedirect("/vendor/branding", message);
  }

  revalidatePath("/vendor/branding");
  redirect("/vendor/branding?saved=1");
}

function readItemForm(formData: FormData): PricingItem {
  return {
    name: str(formData, "name"),
    price: Number(str(formData, "price")) || 0,
    currency: str(formData, "currency") || "INR",
    description: str(formData, "description") || null,
  };
}

export async function addVendorPricingItemAction(formData: FormData) {
  const item = readItemForm(formData);
  if (item.name.length < 1) errorRedirect("/vendor/pricing", "Name is required.");
  if (item.price <= 0) errorRedirect("/vendor/pricing", "Price must be greater than 0.");

  try {
    const current = await fetchVendorPricing();
    await api.put("/vendor/pricing", { items: [...current.items, item] });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to add pricing item.";
    errorRedirect("/vendor/pricing", message);
  }

  revalidatePath("/vendor/pricing");
  redirect("/vendor/pricing");
}

export async function updateVendorPricingItemAction(index: number, formData: FormData) {
  const item = readItemForm(formData);
  if (item.name.length < 1) errorRedirect("/vendor/pricing", "Name is required.");
  if (item.price <= 0) errorRedirect("/vendor/pricing", "Price must be greater than 0.");

  try {
    const current = await fetchVendorPricing();
    const items = current.items.map((existing, i) => (i === index ? item : existing));
    await api.put("/vendor/pricing", { items });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update pricing item.";
    errorRedirect("/vendor/pricing", message);
  }

  revalidatePath("/vendor/pricing");
  redirect("/vendor/pricing");
}

export async function removeVendorPricingItemAction(index: number, formData: FormData) {
  void formData;
  try {
    const current = await fetchVendorPricing();
    const items = current.items.filter((_, i) => i !== index);
    await api.put("/vendor/pricing", { items });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to remove pricing item.";
    errorRedirect("/vendor/pricing", message);
  }

  revalidatePath("/vendor/pricing");
  redirect("/vendor/pricing");
}
