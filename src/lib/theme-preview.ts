/** Resolve theme preview image URLs for the vendor panel (admin assets live on a different origin). */
export function resolveThemePreviewUrl(previewImage?: string | null): string | null {
  if (!previewImage?.trim()) return null;

  const src = previewImage.trim();
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const adminBase = (
    process.env.NEXT_PUBLIC_ADMIN_PANEL_URL ||
    process.env.ADMIN_PANEL_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  if (src.startsWith("/")) {
    return `${adminBase}${src}`;
  }

  return src;
}

export function themeStripeFallback(colors: {
  stripe1?: string;
  stripe2?: string;
  primary?: string;
}) {
  const stripe1 = colors.stripe1 || "#F3D9C0";
  const stripe2 = colors.stripe2 || colors.primary || "#EAC29A";
  return `repeating-linear-gradient(45deg, ${stripe1}, ${stripe1} 10px, ${stripe2} 10px, ${stripe2} 20px)`;
}
