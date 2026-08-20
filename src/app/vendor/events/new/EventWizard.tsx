"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import ui from "@/components/ui.module.css";
import { createEventAction, type CreateEventResult } from "@/lib/events";
import type { Theme } from "@/lib/hooks/useThemes";
import type { YoutubeChannel } from "@/lib/hooks/useYoutube";
import styles from "./wizard.module.css";

const STEP_LABELS = ["Event Details", "YouTube", "Theme", "Event Page", "Publish"];

interface Props {
  customers: { id: string; name: string }[];
  eventTypeOptions: readonly string[];
  themes: Theme[];
  channels: YoutubeChannel[];
  initialThemeId?: string;
}

export function EventWizard({ customers, eventTypeOptions, themes, channels, initialThemeId }: Props) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateEventResult | null>(null);

  const [eventName, setEventName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [eventType, setEventType] = useState(eventTypeOptions[0] ?? "");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState("");

  const [themeId, setThemeId] = useState(initialThemeId ?? "");

  const selectedTheme = themes.find((t) => t.id === themeId);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  function handlePublish() {
    const fd = new FormData();
    fd.set("eventName", eventName);
    fd.set("customerId", customerId);
    fd.set("eventType", eventType);
    fd.set("eventDate", eventDate);
    fd.set("startTime", startTime);
    fd.set("location", location);
    fd.set("pageTitle", pageTitle);
    fd.set("description", description);
    fd.set("coverImage", coverImage);
    fd.set("themeId", themeId);
    fd.set("youtubeChannelId", youtubeChannelId);
    fd.set("youtubeVideoId", youtubeVideoId);
    fd.set("youtubeLiveUrl", youtubeLiveUrl);

    startTransition(async () => {
      const res = await createEventAction(fd);
      setResult(res);
    });
  }

  if (result?.ok && result.event) {
    const { event, shareInfo } = result;
    return (
      <div className={styles.publishCard}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--muted)", marginBottom: 6 }}>
          EVENT PUBLISHED
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 18 }}>{event.eventName}</div>

        {shareInfo ? (
          <>
            <div className={ui.row} style={{ alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shareInfo.qrCodeDataUrl} alt="Event QR code" width={110} height={110} style={{ borderRadius: 8 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Your Event Link</div>
            <div className={styles.linkRow} style={{ marginBottom: 14 }}>
              <div className={styles.linkDisplay}>{shareInfo.publicUrl}</div>
              <button
                type="button"
                className={ui.btnPrimary}
                style={{ padding: "10px 16px", fontSize: 12.5 }}
                onClick={() => navigator.clipboard.writeText(shareInfo.publicUrl)}
              >
                Copy
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <a href={shareInfo.publicUrl} target="_blank" rel="noreferrer" className={ui.btnOutline} style={{ fontSize: 12.5, padding: "9px 16px" }}>
                Preview
              </a>
              {shareInfo.whatsappShareUrl && (
                <a href={shareInfo.whatsappShareUrl} target="_blank" rel="noreferrer" className={ui.btnOutline} style={{ fontSize: 12.5, padding: "9px 16px" }}>
                  WhatsApp
                </a>
              )}
            </div>
          </>
        ) : (
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
            Event link is generating — check the event page shortly.
          </div>
        )}

        <Link href={`/vendor/events/${event.id}`} className={ui.link} style={{ marginTop: 16, display: "inline-block" }}>
          Done — View Event
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.stepsRow}>
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num < step;
          const current = num === step;
          return (
            <div key={label} className={styles.step}>
              <div
                className={styles.stepCircle}
                style={{
                  background: done || current ? "var(--accent)" : "var(--border-soft)",
                  color: done || current ? "#fff" : "var(--muted)",
                }}
              >
                {num}
              </div>
              <div className={styles.stepLabel} style={{ color: current ? "var(--fg)" : "var(--muted)" }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.panel}>
        {result?.ok === false && (
          <div style={{ color: "#E4362B", fontSize: 13, marginBottom: 16, padding: 12, border: "1px solid #E4362B", borderRadius: 8 }} role="alert">
            {result.error}
            {result.event && (
              <>
                {" "}
                <Link href={`/vendor/events/${result.event.id}`} className={ui.link}>
                  View the draft event →
                </Link>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <>
            <div className={styles.stepTitle}>Event Details</div>
            <div className={styles.formGrid}>
              <div>
                <label className={ui.label}>Event Name</label>
                <input
                  className={ui.input}
                  placeholder="e.g. Rahul & Priya Wedding"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Customer</label>
                  <select className={ui.input} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">— No customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={ui.label}>Event Type</label>
                  <select className={ui.input} value={eventType} onChange={(e) => setEventType(e.target.value)}>
                    {eventTypeOptions.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Event Date</label>
                  <input type="date" className={ui.input} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div>
                  <label className={ui.label}>Start Time</label>
                  <input type="time" className={ui.input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={ui.label}>Location</label>
                <input className={ui.input} placeholder="City, Venue" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <label className={ui.label}>Page Title</label>
                <input
                  className={ui.input}
                  placeholder="Rahul Weds Priya"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                />
              </div>
              <div>
                <label className={ui.label}>Description (optional)</label>
                <textarea
                  className={ui.input}
                  rows={3}
                  style={{ resize: "vertical" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className={ui.label}>Cover Image URL (optional)</label>
                <input
                  className={ui.input}
                  placeholder="https://…"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.stepTitle}>YouTube Streaming</div>
            {channels.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                No YouTube channel connected yet.{" "}
                <Link href="/vendor/youtube" className={ui.link}>
                  Connect a channel
                </Link>{" "}
                — or skip this step and link one later from the event page.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className={ui.label}>Channel</label>
                  <select className={ui.input} value={youtubeChannelId} onChange={(e) => setYoutubeChannelId(e.target.value)}>
                    <option value="">— Skip for now —</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.channelName ?? c.channelId}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className={ui.label}>YouTube Live URL</label>
                  <input
                    className={ui.input}
                    placeholder="https://youtube.com/live/xxxxx"
                    value={youtubeLiveUrl}
                    onChange={(e) => setYoutubeLiveUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className={ui.label}>YouTube Video ID (optional)</label>
                  <input
                    className={ui.input}
                    placeholder="dQw4w9WgXcQ"
                    value={youtubeVideoId}
                    onChange={(e) => setYoutubeVideoId(e.target.value)}
                  />
                </div>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.stepTitle}>Select Theme</div>
            {themes.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                No themes are assigned to your account yet — contact your admin. You can publish without one for now.
              </div>
            ) : (
              <div className={styles.themeGrid}>
                {themes.map((th) => {
                  const c = th.config?.colors;
                  return (
                    <button
                      type="button"
                      key={th.id}
                      onClick={() => setThemeId(th.id)}
                      className={`${styles.themeCard} ${themeId === th.id ? styles.themeCardActive : ""}`}
                    >
                      <div
                        className={styles.themeStripe}
                        style={{
                          background: c?.primary
                            ? `repeating-linear-gradient(45deg, ${c.primary}, ${c.primary} 8px, ${c.secondary ?? c.primary} 8px, ${c.secondary ?? c.primary} 16px)`
                            : "var(--border-soft)",
                        }}
                      />
                      <div className={styles.themeName}>{th.name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div className={styles.stepTitle}>Ready to Generate Your Event Page</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              Your event link is generated automatically when you publish — it can&apos;t be
              edited afterward, so double-check the details below first.
            </div>
            <div className={ui.cardTight}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Event</span>
                <span style={{ fontWeight: 700 }}>{eventName || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Customer</span>
                <span style={{ fontWeight: 700 }}>{selectedCustomer?.name ?? "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Theme</span>
                <span style={{ fontWeight: 700 }}>{selectedTheme?.name ?? "Not selected"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>YouTube</span>
                <span style={{ fontWeight: 700 }}>
                  {youtubeChannelId ? channels.find((c) => c.id === youtubeChannelId)?.channelName ?? "Linked" : "Not linked"}
                </span>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className={styles.stepTitle}>Ready to Publish</div>
            <div className={styles.publishSummary}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                Your event is ready. Once published, guests can view and join via the event page.
              </div>
              <div style={{ fontSize: 13 }}>
                <b>Theme:</b> {selectedTheme?.name || "Not selected"}
              </div>
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending || eventName.trim().length < 2}
              className={ui.btnPrimary}
              style={{ width: "100%", textAlign: "center", fontWeight: 800, fontSize: 14, padding: 14, opacity: isPending ? 0.7 : 1 }}
            >
              {isPending ? "PUBLISHING…" : "PUBLISH EVENT"}
            </button>
          </>
        )}

        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className={styles.backBtn}
            style={{ visibility: step === 1 ? "hidden" : "visible" }}
          >
            Back
          </button>
          {step < 5 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              className={ui.btnDark}
              disabled={step === 1 && eventName.trim().length < 2}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}
