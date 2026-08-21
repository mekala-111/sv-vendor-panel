"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import ui from "@/components/ui.module.css";
import { createEventAction, type CreateEventResult } from "@/lib/events";
import type { Theme } from "@/lib/hooks/useThemes";
import type { YoutubeChannel } from "@/lib/hooks/useYoutube";
import { FONT_OPTIONS } from "@/lib/eventOptions";
import styles from "./wizard.module.css";

const STEP_LABELS = [
  "Event Details",
  "Media & Branding",
  "YouTube",
  "Theme",
  "Visitors & Support",
  "Style & SEO",
  "Event Page",
  "Publish",
];

interface Props {
  customers: { id: string; name: string }[];
  eventTypeOptions: readonly string[];
  themes: Theme[];
  channels: YoutubeChannel[];
  initialThemeId?: string;
}

function CheckboxRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, width: 16, height: 16 }}
      />
      <span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{label}</span>
        {hint ? <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>{hint}</span> : null}
      </span>
    </label>
  );
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
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [description, setDescription] = useState("");
  const [liveTiming, setLiveTiming] = useState("");

  const coverImageRef = useRef<HTMLInputElement>(null);
  const logoImageRef = useRef<HTMLInputElement>(null);
  const customImageRef = useRef<HTMLInputElement>(null);
  const whatsappImageRef = useRef<HTMLInputElement>(null);
  const galleryImagesRef = useRef<HTMLInputElement>(null);

  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState("");
  const [youtubeLiveKey, setYoutubeLiveKey] = useState("");
  const [teaserUrl, setTeaserUrl] = useState("");

  const [themeId, setThemeId] = useState(initialThemeId ?? "");

  const [showWatchLive, setShowWatchLive] = useState(true);
  const [showSocialShare, setShowSocialShare] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [accessPin, setAccessPin] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const [fontFamily, setFontFamily] = useState("");
  const [fontColor, setFontColor] = useState("#111111");
  const [remarks1, setRemarks1] = useState("");
  const [remarks2, setRemarks2] = useState("");
  const [scrollMessage, setScrollMessage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

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
    fd.set("googleMapsUrl", googleMapsUrl);
    fd.set("pageTitle", pageTitle);
    fd.set("description", description);
    fd.set("liveTiming", liveTiming);
    fd.set("themeId", themeId);
    fd.set("youtubeChannelId", youtubeChannelId);
    fd.set("youtubeVideoId", youtubeVideoId);
    fd.set("youtubeLiveUrl", youtubeLiveUrl);
    fd.set("youtubeLiveKey", youtubeLiveKey);
    fd.set("teaserUrl", teaserUrl);
    fd.set("showWatchLive", showWatchLive ? "true" : "false");
    fd.set("showSocialShare", showSocialShare ? "true" : "false");
    fd.set("isPublic", isPublic ? "true" : "false");
    fd.set("accessPin", accessPin);
    fd.set("whatsappNumber", whatsappNumber);
    fd.set("whatsappEnabled", whatsappEnabled ? "true" : "false");
    fd.set("fontFamily", fontFamily);
    fd.set("fontColor", fontColor);
    fd.set("remarks1", remarks1);
    fd.set("remarks2", remarks2);
    fd.set("scrollMessage", scrollMessage);
    fd.set("metaTitle", metaTitle);
    fd.set("metaDescription", metaDescription);

    if (coverImageRef.current?.files?.[0]) fd.set("coverImage", coverImageRef.current.files[0]);
    if (logoImageRef.current?.files?.[0]) fd.set("logoImage", logoImageRef.current.files[0]);
    if (customImageRef.current?.files?.[0]) fd.set("customImage", customImageRef.current.files[0]);
    if (whatsappImageRef.current?.files?.[0]) fd.set("whatsappImage", whatsappImageRef.current.files[0]);
    if (galleryImagesRef.current?.files) {
      Array.from(galleryImagesRef.current.files).forEach((f) => fd.append("galleryImages", f));
    }

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
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Location</label>
                  <input className={ui.input} placeholder="City, Venue" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className={ui.label}>Google Maps URL (optional)</label>
                  <input
                    className={ui.input}
                    placeholder="https://maps.google.com/…"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  />
                </div>
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
                <label className={ui.label}>Live Event Timings (display text, optional)</label>
                <input
                  className={ui.input}
                  placeholder="e.g. Live starts 6:00 PM IST onwards"
                  value={liveTiming}
                  onChange={(e) => setLiveTiming(e.target.value)}
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
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.stepTitle}>Media &amp; Branding</div>
            <div className={styles.formGrid}>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Cover Image (max 4MB)</label>
                  <input ref={coverImageRef} type="file" accept="image/*" className={ui.input} />
                </div>
                <div>
                  <label className={ui.label}>Logo (max 500KB)</label>
                  <input ref={logoImageRef} type="file" accept="image/*" className={ui.input} />
                </div>
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Custom Image (max 500KB)</label>
                  <input ref={customImageRef} type="file" accept="image/*" className={ui.input} />
                </div>
                <div>
                  <label className={ui.label}>WhatsApp Image, 500×500 (max 500KB)</label>
                  <input ref={whatsappImageRef} type="file" accept="image/*" className={ui.input} />
                </div>
              </div>
              <div>
                <label className={ui.label}>Gallery Images (up to 10, 4MB each)</label>
                <input ref={galleryImagesRef} type="file" accept="image/*" multiple className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Scroll Message (optional)</label>
                <input
                  className={ui.input}
                  placeholder="Text to scroll on the event page"
                  value={scrollMessage}
                  onChange={(e) => setScrollMessage(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
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
              <div className={styles.formGrid}>
                <div>
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
                <div className={ui.grid2}>
                  <div>
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
                </div>
                <div className={ui.grid2}>
                  <div>
                    <label className={ui.label}>Live Key (optional)</label>
                    <input
                      className={ui.input}
                      placeholder="rt56-t6dt-1kga-kc8a-bkf7"
                      value={youtubeLiveKey}
                      onChange={(e) => setYoutubeLiveKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={ui.label}>Teaser URL (optional)</label>
                    <input
                      className={ui.input}
                      placeholder="https://youtu.be/…"
                      value={teaserUrl}
                      onChange={(e) => setTeaserUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 4 && (
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

        {step === 5 && (
          <>
            <div className={styles.stepTitle}>Visitor Controls &amp; WhatsApp Support</div>
            <div className={styles.formGrid}>
              <div className={ui.grid3}>
                <CheckboxRow label="Public Event" hint="Listed without a direct link" checked={isPublic} onChange={setIsPublic} />
                <CheckboxRow label="Watch Live Button" checked={showWatchLive} onChange={setShowWatchLive} />
                <CheckboxRow label="Social Share Button" checked={showSocialShare} onChange={setShowSocialShare} />
              </div>
              <div>
                <label className={ui.label}>Access PIN (optional)</label>
                <input className={ui.input} placeholder="Leave blank for no PIN" value={accessPin} onChange={(e) => setAccessPin(e.target.value)} />
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>WhatsApp Support Number</label>
                  <input
                    className={ui.input}
                    placeholder="+91 00000 00000"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <CheckboxRow label="Enable WhatsApp Support" checked={whatsappEnabled} onChange={setWhatsappEnabled} />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className={styles.stepTitle}>Style, Remarks &amp; SEO</div>
            <div className={styles.formGrid}>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Font Family</label>
                  <select className={ui.input} value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                    <option value="">Default</option>
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={ui.label}>Font Color</label>
                  <input
                    type="color"
                    className={ui.input}
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    style={{ padding: 4, height: 40 }}
                  />
                </div>
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Remarks 1</label>
                  <textarea className={ui.input} rows={2} style={{ resize: "vertical" }} value={remarks1} onChange={(e) => setRemarks1(e.target.value)} />
                </div>
                <div>
                  <label className={ui.label}>Remarks 2</label>
                  <textarea className={ui.input} rows={2} style={{ resize: "vertical" }} value={remarks2} onChange={(e) => setRemarks2(e.target.value)} />
                </div>
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Meta Title (SEO)</label>
                  <input className={ui.input} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                </div>
                <div>
                  <label className={ui.label}>Meta Description (SEO)</label>
                  <input className={ui.input} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 7 && (
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
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>WhatsApp Support</span>
                <span style={{ fontWeight: 700 }}>{whatsappEnabled ? whatsappNumber || "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </>
        )}

        {step === 8 && (
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
          {step < STEP_LABELS.length && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEP_LABELS.length, s + 1))}
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
