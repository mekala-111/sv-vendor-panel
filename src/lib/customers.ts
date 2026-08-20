"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "./api";

function errorRedirect(to: string, message: string): never {
  redirect(`${to}?error=${encodeURIComponent(message)}`);
}

export async function createCustomerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (name.length < 2) errorRedirect("/vendor/customers/new", "Name must be at least 2 characters.");
  if (!email.includes("@")) errorRedirect("/vendor/customers/new", "Enter a valid email address.");
  if (password.length < 8) errorRedirect("/vendor/customers/new", "Password must be at least 8 characters.");
  if (password !== confirmPassword) errorRedirect("/vendor/customers/new", "Passwords do not match.");

  let created: { id: string };
  try {
    created = await api.post<{ id: string }>("/customers", {
      name,
      email,
      password,
      ...(phone ? { phone } : {}),
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to create customer.";
    errorRedirect("/vendor/customers/new", message);
  }

  revalidatePath("/vendor/customers");
  redirect(`/vendor/customers/${created.id}`);
}

export async function updateCustomerAction(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (name.length < 2) errorRedirect(`/vendor/customers/${id}/edit`, "Name must be at least 2 characters.");
  if (!email.includes("@")) errorRedirect(`/vendor/customers/${id}/edit`, "Enter a valid email address.");

  try {
    await api.patch(`/customers/${id}`, { name, email, phone: phone || undefined });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update customer.";
    errorRedirect(`/vendor/customers/${id}/edit`, message);
  }

  revalidatePath("/vendor/customers");
  revalidatePath(`/vendor/customers/${id}`);
  redirect(`/vendor/customers/${id}`);
}

export async function setCustomerStatusAction(id: string, status: "ACTIVE" | "INACTIVE", formData: FormData) {
  void formData;
  try {
    await api.patch(`/customers/${id}`, { status });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Failed to update customer status.";
    errorRedirect(`/vendor/customers/${id}`, message);
  }

  revalidatePath("/vendor/customers");
  revalidatePath(`/vendor/customers/${id}`);
  redirect(`/vendor/customers/${id}`);
}
