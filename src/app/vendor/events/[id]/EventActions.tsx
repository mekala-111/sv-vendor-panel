"use client";

import { useEffect, useMemo, useState } from "react";
import ui from "@/components/ui.module.css";
import {
  getConfiguredPublicEventBase,
  isLoopbackPublicBase,
  resolveScannablePublicEventUrl,
} from "@/lib/public-event-url";
import { resolveEventShareImageUrl, shareEventWithImage } from "@/lib/share-event";

export function EventQuickActions({
  eventSlug,
  eventId,
  eventName,
  coverImage,
  invitationCard,
  whatsappImage,
  isLive = false,
}: {
  eventSlug?: string | null;
  eventId: string;
  eventName?: string | null;
  coverImage?: string | null;
  invitationCard?: string | null;
  whatsappImage?: string | null;
  isLive?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    if (!isLive || !eventSlug) {
      setLiveUrl("");
      return;
    }
    setLiveUrl(resolveScannablePublicEventUrl(eventSlug));
  }, [isLive, eventSlug]);

  const qrSrc = useMemo(
    () =>
      liveUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(liveUrl)}`
        : "",
    [liveUrl]
  );

  async function copyLink() {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function shareEvent() {
    if (!liveUrl) return;
    const imageUrl = resolveEventShareImageUrl({ whatsappImage, coverImage, invitationCard });
    await shareEventWithImage({
      url: liveUrl,
      text: `You're invited: ${eventName || "Our event"}\n${liveUrl}`,
      imageUrl,
      title: eventName || "Event invitation",
      fileName: "event-invite.png",
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {isLive && liveUrl ? (
          <a
            className={ui.btnOutlineSm}
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            Open live event
          </a>
        ) : (
          <span className={ui.btnOutlineSm} style={{ opacity: 0.45, cursor: "not-allowed" }}>
            Open live event
          </span>
        )}
        <button type="button" className={ui.btnOutlineSm} onClick={copyLink} disabled={!liveUrl}>
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button
          type="button"
          className={ui.btnOutlineSm}
          onClick={() => setShowQr((v) => !v)}
          disabled={!liveUrl}
        >
          QR Code
        </button>
        <a
          className={ui.btnOutlineSm}
          href={`/vendor/events/new?step=1&eventId=${encodeURIComponent(eventId)}`}
          style={{ textDecoration: "none" }}
        >
          Edit
        </a>
        <a
          className={ui.btnOutlineSm}
          href={`/vendor/events/new?step=2&eventId=${encodeURIComponent(eventId)}`}
          style={{ textDecoration: "none" }}
        >
          Change Theme
        </a>
        <a
          className={ui.btnOutlineSm}
          href={`/vendor/events/${eventId}?tab=${encodeURIComponent("Theme Content")}`}
          style={{ textDecoration: "none" }}
        >
          YouTube
        </a>
        {isLive && liveUrl ? (
          <button type="button" className={ui.btnOutlineSm} onClick={shareEvent}>
            Share
          </button>
        ) : (
          <span className={ui.btnOutlineSm} style={{ opacity: 0.45, cursor: "not-allowed" }}>
            Share
          </span>
        )}
      </div>

      {showQr && qrSrc ? (
        <div className={ui.card} style={{ marginBottom: 16, maxWidth: 280, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="Event QR code" width={220} height={220} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: 12, color: "var(--muted)", wordBreak: "break-all", marginBottom: 8 }}>
            {liveUrl}
          </div>
          {isLoopbackPublicBase(getConfiguredPublicEventBase()) ? (
            <div style={{ fontSize: 11.5, color: "#B7791F", lineHeight: 1.4 }}>
              Phone scan: open the vendor panel via your computer&apos;s Wi‑Fi IP (not localhost), or set
              NEXT_PUBLIC_PUBLIC_EVENT_BASE_URL to that IP on port 3002.
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
