"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import ui from "@/components/ui.module.css";
import { filterThemesForEventType } from "@/lib/event-kind";
import { submitLiveEventSinglePage } from "@/lib/event-actions";
import {
  DomainSlugInput,
  GalleryImagesField,
  ImageFileField,
  RememberThemeGrid,
  RevealStreamKey,
} from "./WizardClient";
import styles from "./singlePage.module.css";

type ThemeOption = {
  id: string;
  name: string;
  previewImage?: string | null;
  stripe1?: string;
  stripe2?: string;
  primary?: string;
  eventTypes?: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Live Starts on 13 Oct, 2026 from 6:00 PM IST Onwards" — the legacy default. */
function defaultTiming(date: string) {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `Live Starts on ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}, ${m[1]} from 6:00 PM IST Onwards`;
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        {label}
        {hint ? <span className={styles.rowHint}>{hint}</span> : null}
      </div>
      <div className={styles.rowField}>{children}</div>
    </div>
  );
}

/** One-page Create Live Event in the legacy eLive field order; "Pay" saves everything and opens payment. */
export function LiveEventSinglePageForm({
  themes,
  eventTypes,
  fonts,
  channels,
  fee,
}: {
  themes: ThemeOption[];
  eventTypes: string[];
  fonts: string[];
  channels: { id: string; channelName?: string | null }[];
  fee: number;
}) {
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState(eventTypes[0] ?? "");
  const [timing, setTiming] = useState("");
  const [timingEdited, setTimingEdited] = useState(false);
  const [watchLive, setWatchLive] = useState(true);
  const [socialShare, setSocialShare] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const designs = useMemo(
    () =>
      filterThemesForEventType(
        themes.map((t) => ({ ...t, _id: t.id, config: { eventTypes: t.eventTypes } })),
        eventType
      ),
    [themes, eventType]
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Handled manually (not <form action>) so a failed save keeps everything typed, incl. images.
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (designs.length && !formData.get("themeId")) {
      setError("Please choose a design.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await submitLiveEventSinglePage(formData);
      if (result?.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <Row label="Selected service">
        <label className={styles.inline}>
          <input type="radio" name="service" value="youtube" defaultChecked /> YouTube
        </label>
      </Row>

      <Row label="Event date">
        <input
          name="eventDate"
          type="date"
          className={ui.input}
          required
          value={eventDate}
          onChange={(e) => {
            setEventDate(e.target.value);
            if (!timingEdited) setTiming(defaultTiming(e.target.value));
          }}
        />
      </Row>

      <Row label="Event type" hint="Ex: Wedding / Reunion">
        <select name="eventType" className={ui.input} value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Row>

      <Row label="Design" hint="Designs suited to the event type">
        {designs.length ? (
          // Re-mounts per event type so the remembered choice is re-applied to the new list.
          <RememberThemeGrid key={eventType} name="themeId" themes={designs} />
        ) : (
          <p className={styles.muted}>No designs assigned yet — you can pick one later.</p>
        )}
      </Row>

      <Row label="Page title" hint="Ex: Ravi weds Rani">
        <input name="pageTitle" className={ui.input} required minLength={2} placeholder="Ravi weds Rani" />
      </Row>

      <Row label="Live event timings">
        <input
          name="liveTiming"
          className={ui.input}
          placeholder="Live Starts on 13 Oct, 2026 from 6:00 PM IST Onwards"
          value={timing}
          onChange={(e) => {
            setTiming(e.target.value);
            setTimingEdited(e.target.value.trim() !== "");
          }}
        />
      </Row>

      <Row label="Domain name" hint="Ex: raviwedsrani — small letters, no spaces">
        <DomainSlugInput name="eventSlug" />
      </Row>

      <Row label="YouTube channel">
        <select name="youtubeChannelId" className={ui.input} defaultValue="">
          <option value="">-- Select --</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.channelName || c.id}
            </option>
          ))}
        </select>
      </Row>

      <Row label="YouTube live URL" hint='Ex: "https://youtube.com/live/_eZppUQh9kU"'>
        <input name="youtubeLiveUrl" className={ui.input} placeholder="https://youtube.com/live/…" />
      </Row>

      <Row label="YouTube live key" hint='Ex: "rt56-t6dt-1kga-kc8a-bkf7"'>
        <RevealStreamKey name="youtubeLiveKey" />
      </Row>

      <Row label="Teaser URL" hint='Ex: "https://youtu.be/LsVQ3F3LCcE"'>
        <input name="teaserUrl" className={ui.input} placeholder="https://youtu.be/…" />
      </Row>

      <Row label="Scroll message">
        <input name="scrollMessage" className={ui.input} placeholder="Welcome to our live stream" />
      </Row>

      <Row label="Images" hint="Up to 10 · JPEG/PNG/WebP">
        <GalleryImagesField name="galleryImages" max={10} />
      </Row>

      <Row label="Main photo" hint="Shown in the theme's photo frame">
        <ImageFileField name="coverImage" label="" />
      </Row>

      <Row label="Logo">
        <ImageFileField name="logoImage" label="" />
      </Row>

      <Row label="Custom image" hint="Player poster · height ~800px">
        <ImageFileField name="customImage" label="" />
      </Row>

      <Row label="WhatsApp image" hint="500×500 or larger — used when sharing">
        <ImageFileField name="whatsappImage" label="" />
      </Row>

      <Row label="Add Watch Live button">
        <label className={styles.inline}>
          <input type="checkbox" checked={watchLive} onChange={(e) => setWatchLive(e.target.checked)} /> Show
        </label>
        <input type="hidden" name="showWatchLive" value={watchLive ? "true" : "false"} />
      </Row>

      <Row label="Add social media share button">
        <label className={styles.inline}>
          <input type="checkbox" checked={socialShare} onChange={(e) => setSocialShare(e.target.checked)} /> Show
        </label>
        <input type="hidden" name="showSocialShare" value={socialShare ? "true" : "false"} />
      </Row>

      <Row label="WhatsApp support number" hint="10 digits">
        <input
          name="whatsappNumber"
          className={ui.input}
          inputMode="numeric"
          maxLength={10}
          pattern="\d{10}"
          placeholder="9876543210"
        />
      </Row>

      <Row label="Remarks 1">
        <textarea name="remarks1" className={ui.input} rows={2} />
      </Row>

      <Row label="Remarks 2">
        <textarea name="remarks2" className={ui.input} rows={2} />
      </Row>

      <Row label="Font style">
        <select name="fontFamily" className={ui.input} defaultValue="">
          <option value="">Theme default</option>
          {fonts.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </Row>

      <div className={styles.footer}>
        <button type="submit" className={ui.btnDark} disabled={pending}>
          {pending ? "Saving…" : fee > 0 ? `Pay ₹${fee.toLocaleString("en-IN")}` : "Pay & Create"}
        </button>
      </div>
    </form>
  );
}
