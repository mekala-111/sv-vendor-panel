/** Vendor profile & branding fetchers for the vendor panel. */

import { api } from "@/lib/api";

export interface VendorBranding {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
  supportEmail?: string;
}

export interface VendorWallet {
  id: string;
  vendorId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  vendorCode: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";
  planId: string | null;
  eventCreationFee: number;
  whatsappNumber: string | null;
  whatsappEnabled: boolean;
  branding: VendorBranding;
  createdAt: string;
  updatedAt: string;
  wallet: VendorWallet | null;
}

export async function fetchVendorProfile(): Promise<VendorProfile> {
  return api.get<VendorProfile>("/vendors/me");
}

export async function fetchVendorBranding(): Promise<VendorBranding> {
  return api.get<VendorBranding>("/vendors/me/branding");
}
