"use client";

import { useEffect, useState } from "react";
import ui from "@/components/ui.module.css";
import { resolveScannablePublicInvitationUrl } from "@/lib/public-event-url";
import {
  buildInvitationShareText,
  resolveEventShareImageUrl,
  shareEventWithImage,
} from "@/lib/share-event";

export function InvitationShareButton({
  invitationSlug,
  invitationName,
  brideName,
  groomName,
  coverImage,
  invitationCard,
  whatsappImage,
  isPublished = false,
  variant = "outline",
}: {
  invitationSlug?: string | null;
  invitationName?: string | null;
  brideName?: string | null;
  groomName?: string | null;
  coverImage?: string | null;
  invitationCard?: string | null;
  whatsappImage?: string | null;
  isPublished?: boolean;
  variant?: "outline" | "primary";
}) {
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!isPublished || !invitationSlug) {
      setShareUrl("");
      return;
    }
    setShareUrl(resolveScannablePublicInvitationUrl(invitationSlug));
  }, [isPublished, invitationSlug]);

  async function shareInvitation() {
    if (!shareUrl || sharing) return;
    setSharing(true);
    try {
      const imageUrl = resolveEventShareImageUrl({ whatsappImage, coverImage, invitationCard });
      const text = buildInvitationShareText({
        url: shareUrl,
        title: invitationName,
        brideName,
        groomName,
      });
      await shareEventWithImage({
        url: shareUrl,
        text,
        imageUrl,
        title: invitationName || "Wedding invitation",
        fileName: "wedding-invitation.png",
      });
    } finally {
      setSharing(false);
    }
  }

  const enabled = Boolean(isPublished && shareUrl);
  const className = variant === "primary" ? ui.btnPrimary : ui.btnOutlineSm;

  if (!enabled) {
    return (
      <span className={className} style={{ opacity: 0.45, cursor: "not-allowed" }}>
        Share Invitation
      </span>
    );
  }

  return (
    <button type="button" className={className} onClick={shareInvitation} disabled={sharing}>
      {sharing ? "Opening share…" : "Share Invitation"}
    </button>
  );
}
