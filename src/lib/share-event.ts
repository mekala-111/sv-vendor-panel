function absoluteAssetUrl(url: string | null | undefined) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (typeof window === "undefined") return url;
  const apiOrigin =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (url.startsWith("/")) return `${apiOrigin}${url}`;
  return new URL(url, window.location.origin).href;
}

export function resolveEventShareImageUrl(
  raw: {
    whatsappImage?: string | null;
    coverImage?: string | null;
    invitationCard?: string | null;
  },
  fallbackUrl?: string | null
) {
  return absoluteAssetUrl(
    raw.whatsappImage || raw.coverImage || raw.invitationCard || fallbackUrl || null
  );
}

export function buildInvitationShareText({
  url,
  title,
  brideName,
  groomName,
}: {
  url: string;
  title?: string | null;
  brideName?: string | null;
  groomName?: string | null;
}) {
  const couple =
    brideName && groomName
      ? `${groomName} & ${brideName}`
      : brideName || groomName || title || "Our celebration";
  const lines = [
    `🌸 You're invited! 🌸`,
    "",
    couple,
    title && title !== couple ? title : null,
    "",
    `💍 View invitation:`,
    url,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function shareEventWithImage({
  url,
  text,
  imageUrl,
  title,
  fileName = "event-invite.png",
}: {
  url: string;
  text: string;
  imageUrl?: string | null;
  title?: string;
  fileName?: string;
}) {
  const message = text || url;
  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const absoluteImage = absoluteAssetUrl(imageUrl);

  if (absoluteImage) {
    try {
      const res = await fetch(absoluteImage);
      if (res.ok) {
        const blob = await res.blob();
        const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";
        const file = new File([blob], fileName, { type });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: message, title: title || undefined });
          return;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text: message, url, title: title || undefined });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  openWhatsApp();
}
