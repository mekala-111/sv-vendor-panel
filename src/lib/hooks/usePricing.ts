/** Vendor pricing fetcher for the vendor panel. */

import { api } from "@/lib/api";

export interface PricingItem {
  name: string;
  price: number;
  currency: string;
  description: string | null;
}

export interface VendorPricing {
  id?: string;
  vendorId: string;
  items: PricingItem[];
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchVendorPricing(): Promise<VendorPricing> {
  return api.get<VendorPricing>("/vendor/pricing");
}
