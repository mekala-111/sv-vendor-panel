/** Theme catalog fetchers for the vendor panel. Vendors can only read themes assigned to them — creating/editing a Theme is admin-only. */

import { api } from "@/lib/api";

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  [key: string]: unknown;
}

export interface ThemeConfig {
  colors?: ThemeColors;
  [key: string]: unknown;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  previewImage: string | null;
  config: ThemeConfig;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
}

export interface VendorThemeAssignment {
  id: string;
  vendorId: string;
  themeId: string;
  isEnabled: boolean;
  isDefault: boolean;
  theme: Theme;
}

export async function fetchVendorThemes(): Promise<VendorThemeAssignment[]> {
  return api.get<VendorThemeAssignment[]>("/themes/vendor-assigned");
}
