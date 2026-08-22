"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";

export function PreviewEventButton({
  eventId,
  disabled,
  kind = "live",
}: {
  eventId: string;
  disabled?: boolean;
  kind?: "live" | "invitation";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPreview() {
    setLoading(true);
    setError("");
    try {
      const endpoint =
        kind === "invitation" ? "/api/invitations/preview-token" : "/api/events/preview-token";
      const body =
        kind === "invitation" ? { invitationId: eventId } : { eventId };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.publicUrl) {
        throw new Error(json?.error || "Could not create preview link");
      }
      window.open(json.publicUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={ui.btnOutlineSm}
        disabled={disabled || loading}
        onClick={openPreview}
      >
        {loading ? "Opening…" : kind === "invitation" ? "Preview invitation page" : "Preview event page"}
      </button>
      {error ? (
        <p style={{ marginTop: 6, fontSize: 12, color: "#E4362B", fontWeight: 600 }}>{error}</p>
      ) : null}
    </div>
  );
}
