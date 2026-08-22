import { resolveThemePreviewUrl, themeStripeFallback } from "@/lib/theme-preview";

export function ThemePreviewImage({
  previewUrl,
  name,
  className = "",
  style,
  fallbackColors,
}: {
  previewUrl?: string | null;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackColors?: { stripe1?: string; stripe2?: string; primary?: string };
}) {
  const src = resolveThemePreviewUrl(previewUrl);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} preview`}
        className={className}
        style={{ objectFit: "cover", display: "block", ...style }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        background: themeStripeFallback(fallbackColors ?? {}),
        ...style,
      }}
      aria-label={`${name} preview`}
    />
  );
}
