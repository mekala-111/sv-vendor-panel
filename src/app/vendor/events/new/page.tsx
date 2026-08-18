"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ui from "@/components/ui.module.css";
import { customers, eventTypeOptions, vendorThemes } from "@/lib/data";
import styles from "./wizard.module.css";

const STEP_LABELS = ["Event Details", "YouTube", "Theme", "Event Page", "Publish"];

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(false);

  const [eventName, setEventName] = useState("");
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [streamKeyRevealed, setStreamKeyRevealed] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const displayName = eventName || "Rahul Weds Priya";
  const slug = slugOverride ?? (slugify(eventName) || "rahul-weds-priya");
  const eventLink = `live.svlive.in/${slug}`;

  if (published) {
    return (
      <div className={styles.publishCard}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--muted)", marginBottom: 6 }}>
          EVENT PUBLISHED
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 18 }}>{displayName}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>Your Event Link</div>
        <div className={styles.linkDisplay} style={{ marginBottom: 14 }}>{eventLink}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <button type="button" className={ui.btnPrimary} style={{ fontSize: 12.5, padding: "9px 16px" }}>Copy Link</button>
          <button type="button" className={ui.btnOutline} style={{ fontSize: 12.5, padding: "9px 16px" }}>Preview</button>
          <button type="button" className={ui.btnOutline} style={{ fontSize: 12.5, padding: "9px 16px" }}>QR Code</button>
          <button type="button" className={ui.btnOutline} style={{ fontSize: 12.5, padding: "9px 16px" }}>WhatsApp</button>
        </div>
        <button
          type="button"
          onClick={() => router.push("/vendor/events")}
          className={ui.link}
          style={{ marginTop: 16, background: "none", border: "none" }}
        >
          Done — Back to Events
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className={ui.pageTitle}>Create Event</h1>

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
                  <select className={ui.input}>
                    {customers.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={ui.label}>Event Type</label>
                  <select className={ui.input}>
                    {eventTypeOptions.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={ui.grid2}>
                <div>
                  <label className={ui.label}>Event Date</label>
                  <input type="date" className={ui.input} />
                </div>
                <div>
                  <label className={ui.label}>Live Timing</label>
                  <input type="time" className={ui.input} />
                </div>
              </div>
              <div>
                <label className={ui.label}>Location</label>
                <input className={ui.input} placeholder="City, Venue" />
              </div>
              <div>
                <label className={ui.label}>Page Title</label>
                <input className={ui.input} placeholder="Rahul Weds Priya" />
              </div>
              <div>
                <label className={ui.label}>Cover Image</label>
                <div className={ui.dropzone}>drop cover image here</div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.stepTitle}>YouTube Streaming</div>
            <div style={{ marginBottom: 14 }}>
              <label className={ui.label}>Channel</label>
              <select className={ui.input}>
                <option>SV Events Live</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className={ui.label}>YouTube Live URL</label>
              <input className={ui.input} placeholder="https://youtube.com/live/xxxxx" />
            </div>
            <div>
              <label className={ui.label}>Stream Key</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  readOnly
                  value={streamKeyRevealed ? "sk_live_8f2k91q3m7x" : "••••••••••••••••"}
                  className={ui.inputMono}
                  style={{ background: "var(--bg)" }}
                />
                <button type="button" className={ui.btnOutlineSm} onClick={() => setStreamKeyRevealed((v) => !v)}>
                  {streamKeyRevealed ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>
            <div style={{ margin: "14px 0" }}>
              <label className={ui.label}>Teaser Video (optional)</label>
              <input className={ui.input} placeholder="https://youtu.be/xxxxx" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
              <button type="button" className={ui.btnOutlineSm}>Test Connection</button>
              <span
                className={ui.badge}
                style={{ color: "#1E9E5A", background: "rgba(30,158,90,0.12)" }}
              >
                🟢 Connected
              </span>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.stepTitle}>Select Theme</div>
            <div className={styles.themeGrid}>
              {vendorThemes.map((th) => (
                <button
                  type="button"
                  key={th.slug}
                  onClick={() => setSelectedTheme(th.name)}
                  className={`${styles.themeCard} ${selectedTheme === th.name ? styles.themeCardActive : ""}`}
                >
                  <div
                    className={styles.themeStripe}
                    style={{
                      background: `repeating-linear-gradient(45deg, ${th.stripe1}, ${th.stripe1} 8px, ${th.stripe2} 8px, ${th.stripe2} 16px)`,
                    }}
                  />
                  <div className={styles.themeName}>{th.name}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className={styles.stepTitle}>Generate Event Link</div>
            <label className={ui.label}>Domain Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlugOverride(slugify(e.target.value))}
              className={ui.inputMono}
              style={{ marginBottom: 16 }}
            />
            <div className={ui.row} style={{ alignItems: "center" }}>
              <div className={styles.qrBox}>QR CODE</div>
              <div style={{ flex: 1 }}>
                <label className={ui.label}>Your Event Link</label>
                <div className={styles.linkRow}>
                  <div className={styles.linkDisplay}>{eventLink}</div>
                  <button type="button" className={ui.btnPrimary} style={{ padding: "10px 16px", fontSize: 12.5 }}>
                    Copy
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button type="button" className={ui.btnOutlineSm}>WhatsApp</button>
                  <button type="button" className={ui.btnOutlineSm}>Facebook</button>
                  <button type="button" className={ui.btnOutlineSm}>Share</button>
                </div>
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
                <b>Theme:</b> {selectedTheme || "Not selected"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPublished(true)}
              className={ui.btnPrimary}
              style={{ width: "100%", textAlign: "center", fontWeight: 800, fontSize: 14, padding: 14 }}
            >
              PUBLISH EVENT
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
            <button type="button" onClick={() => setStep((s) => Math.min(5, s + 1))} className={ui.btnDark}>
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}
