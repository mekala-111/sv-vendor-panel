"use client";

import { useCallback, useMemo } from "react";
import ui from "@/components/ui.module.css";
import { eventFontOptions } from "@/lib/data";
import type { ThemeFieldDef } from "@/lib/theme-config";
import { normalizeTimeForInput } from "@/lib/time-input";
import {
  GalleryImagesField,
  ImageFileField,
  RevealStreamKey,
  SubEventsField,
} from "@/app/vendor/events/new/WizardClient";
import styles from "@/app/vendor/events/new/wizard.module.css";

function fieldDefaultValue(key: string, raw: Record<string, unknown>, type?: ThemeFieldDef["type"]): string {
  const aliases: Record<string, string[]> = {
    eventPlace: ["location"],
    eventTime: ["liveTiming"],
  };
  let v = raw[key];
  if (v == null && aliases[key]) {
    for (const alt of aliases[key]) {
      if (raw[alt] != null && raw[alt] !== "") {
        v = raw[alt];
        break;
      }
    }
  }
  if (v == null) return "";
  if (key === "eventDate" && typeof v === "string" && v.includes("T")) {
    return new Date(v).toISOString().slice(0, 10);
  }
  const str = String(v);
  if (type === "time" || key === "eventTime" || key === "liveTiming") {
    return normalizeTimeForInput(str);
  }
  return str;
}

function coerceBool(value: unknown, defaultValue = true): boolean {
  if (value === false || value === 0 || value === "0") return false;
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "false" || v === "off" || v === "no") return false;
    if (v === "true" || v === "on" || v === "yes") return true;
  }
  if (value == null) return defaultValue;
  return Boolean(value);
}

export function initThemeContent(raw: Record<string, unknown>, fields: ThemeFieldDef[]) {
  const content: Record<string, unknown> = {};
  const hasSubEventsField = fields.some((field) => field.type === "subEvents");
  if (hasSubEventsField) {
    content.showSubEvents = coerceBool(raw.showSubEvents, true);
  }
  const hasInvitationCardField = fields.some((field) => field.key === "invitationCard");
  if (hasInvitationCardField) {
    content.showInvitationCard = coerceBool(raw.showInvitationCard, true);
  }
  for (const field of fields) {
    if (field.type === "subEvents") {
      content.subEvents = Array.isArray(raw.subEvents) ? raw.subEvents : [];
    } else if (field.type === "gallery") {
      content.galleryImages = Array.isArray(raw.galleryImages) ? raw.galleryImages : [];
    } else {
      const v = fieldDefaultValue(field.key, raw, field.type);
      if (v) content[field.key] = v;
    }
  }
  content.showWatchLive = coerceBool(raw.showWatchLive, true);
  content.showSocialShare = coerceBool(raw.showSocialShare, true);
  for (const key of [
    "whatsappImage",
    "whatsappNumber",
    "fontFamily",
    "fontColor",
    "accessPin",
    "youtubeChannelId",
    "logoImage",
    "customImage",
  ]) {
    if (content[key]) continue;
    const v = fieldDefaultValue(key, raw);
    if (v) content[key] = v;
  }
  return content;
}

export type YoutubeChannelOption = { id: string; channelName?: string | null };

export function ThemeContentFields({
  fields,
  content,
  onContentChange,
  raw = {},
  kind = "invitation",
  youtubeChannels = [],
}: {
  fields: ThemeFieldDef[];
  content: Record<string, unknown>;
  onContentChange: (content: Record<string, unknown>) => void;
  /** Optional leftovers for stream-key defaults when not in content yet. */
  raw?: Record<string, unknown>;
  kind?: "live" | "invitation";
  youtubeChannels?: YoutubeChannelOption[];
}) {
  const patch = useCallback(
    (key: string, value: unknown) => {
      onContentChange({ ...content, [key]: value });
    },
    [content, onContentChange]
  );

  const fieldList = useMemo(() => fields, [fields]);

  if (!fieldList.length) {
    return (
      <div className={styles.formGrid}>
        <p style={{ fontSize: 13, color: "var(--muted-strong)" }}>
          No content fields for this theme. Go back and select a theme first.
        </p>
        <EventPageOptions
          kind={kind}
          content={content}
          onPatch={patch}
          fieldKeys={new Set()}
          youtubeChannels={youtubeChannels}
        />
      </div>
    );
  }

  return (
    <div className={styles.formGrid}>
      {fieldList.map((field) => {
        if (field.type === "subEvents") {
          const showSubEvents = content.showSubEvents !== false;
          const defaultValue = Array.isArray(content.subEvents)
            ? (content.subEvents as {
                title?: string;
                date?: string | null;
                time?: string | null;
                place?: string | null;
                image?: string | null;
              }[]).map((row) => ({
                title: row.title ?? "",
                date: row.date ?? undefined,
                time: normalizeTimeForInput(String(row.time ?? "")),
                place: row.place ?? undefined,
                image: row.image ?? undefined,
              }))
            : [];
          return (
            <div key={field.key}>
              {/* Same state as the switch — posted on save without a parent useEffect lag. */}
              <input type="hidden" name="showSubEvents" value={showSubEvents ? "true" : "false"} />
              <div className={styles.subEventsToggleRow}>
                <div>
                  <div className={ui.label}>Sub events</div>
                  <div className={styles.fieldHint}>Show schedule on the invitation (Haldi, Sangeet, etc.)</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showSubEvents}
                  aria-label="Show sub events on invitation"
                  data-toast="Sub events"
                  className={`${styles.toggleSwitch} ${showSubEvents ? styles.toggleSwitchOn : ""}`}
                  onClick={() => patch("showSubEvents", !showSubEvents)}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
              <div style={{ display: showSubEvents ? undefined : "none" }}>
                <SubEventsField
                  defaultValue={defaultValue}
                  showLabel={false}
                  onValueChange={(rows) => patch("subEvents", rows.filter((r) => r.title.trim()))}
                />
              </div>
            </div>
          );
        }

        if (field.type === "gallery") {
          const defaultValue = Array.isArray(content.galleryImages)
            ? (content.galleryImages as string[])
            : [];
          return (
            <GalleryImagesField
              key={field.key}
              name={field.key}
              defaultValue={defaultValue}
              max={field.maxItems ?? 20}
              onValueChange={(images) => patch("galleryImages", images)}
            />
          );
        }

        if (field.type === "image") {
          if (field.key === "invitationCard") {
            const showInvitationCard = content.showInvitationCard !== false;
            return (
              <div key={field.key}>
                <input
                  type="hidden"
                  name="showInvitationCard"
                  value={showInvitationCard ? "true" : "false"}
                />
                <div className={styles.subEventsToggleRow}>
                  <div>
                    <div className={ui.label}>Invitation card</div>
                    <div className={styles.fieldHint}>Show the envelope invitation section on the theme</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showInvitationCard}
                    aria-label="Show invitation card on theme"
                    data-toast="Invitation card"
                    className={`${styles.toggleSwitch} ${showInvitationCard ? styles.toggleSwitchOn : ""}`}
                    onClick={() => patch("showInvitationCard", !showInvitationCard)}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                <div style={{ display: showInvitationCard ? undefined : "none" }}>
                  <ImageFileField
                    name={field.key}
                    label="Card image"
                    hint={field.hint}
                    defaultValue={String(content[field.key] ?? "")}
                    onValueChange={(value) => patch(field.key, value)}
                  />
                </div>
              </div>
            );
          }

          return (
            <ImageFileField
              key={field.key}
              name={field.key}
              label={field.label}
              hint={field.hint}
              defaultValue={String(content[field.key] ?? "")}
              onValueChange={(value) => patch(field.key, value)}
            />
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.key}>
              <label className={ui.label} htmlFor={field.key}>
                {field.label}
              </label>
              <textarea
                id={field.key}
                name={field.key}
                className={ui.input}
                rows={3}
                placeholder={field.placeholder}
                value={String(content[field.key] ?? "")}
                onChange={(e) => patch(field.key, e.target.value)}
                required={field.required}
                style={{ minHeight: 80, resize: "vertical" }}
              />
            </div>
          );
        }

        if (field.type === "streamKey") {
          return (
            <div key={field.key}>
              <label className={ui.label} htmlFor={field.key}>
                {field.label}
              </label>
              <RevealStreamKey
                name={field.key}
                defaultValue={String(content[field.key] ?? raw[field.key] ?? "")}
              />
            </div>
          );
        }

        const inputType = field.type === "date" ? "date" : field.type === "time" ? "time" : "text";
        return (
          <div key={field.key}>
            {field.key === "youtubeLiveUrl" ? (
              <div className={ui.label} style={{ marginTop: 8, marginBottom: 10 }}>
                YouTube Live
              </div>
            ) : null}
            <label className={ui.label} htmlFor={field.key}>
              {field.label}
            </label>
            <input
              id={field.key}
              name={field.key}
              type={inputType}
              className={ui.input}
              placeholder={field.placeholder}
              value={String(content[field.key] ?? "")}
              onChange={(e) => patch(field.key, e.target.value)}
              required={field.required}
            />
          </div>
        );
      })}
      <EventPageOptions
        kind={kind}
        content={content}
        onPatch={patch}
        fieldKeys={new Set(fieldList.map((f) => f.key))}
        youtubeChannels={youtubeChannels}
      />
    </div>
  );
}

function EventPageOptions({
  kind,
  content,
  onPatch,
  fieldKeys,
  youtubeChannels,
}: {
  kind: "live" | "invitation";
  content: Record<string, unknown>;
  onPatch: (key: string, value: unknown) => void;
  fieldKeys: Set<string>;
  youtubeChannels: YoutubeChannelOption[];
}) {
  const showWatchLive = content.showWatchLive !== false;
  const showSocialShare = content.showSocialShare !== false;
  const fontColor = String(content.fontColor ?? "#FFCC00");

  return (
    <>
      {kind === "live" && youtubeChannels.length > 0 ? (
        <div>
          <label className={ui.label} htmlFor="youtubeChannelId">
            YouTube channel
          </label>
          <select
            id="youtubeChannelId"
            name="youtubeChannelId"
            className={ui.input}
            value={String(content.youtubeChannelId ?? "")}
            onChange={(e) => onPatch("youtubeChannelId", e.target.value)}
          >
            <option value="">-- Select --</option>
            {youtubeChannels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.channelName || ch.id}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!fieldKeys.has("logoImage") ? (
        <ImageFileField
          name="logoImage"
          label="Logo"
          hint="Max 500KB"
          defaultValue={String(content.logoImage ?? "")}
          onValueChange={(value) => onPatch("logoImage", value)}
        />
      ) : null}
      {!fieldKeys.has("customImage") ? (
        <ImageFileField
          name="customImage"
          label="Custom image"
          hint="Height 800px · under 500KB"
          defaultValue={String(content.customImage ?? "")}
          onValueChange={(value) => onPatch("customImage", value)}
        />
      ) : null}
      <ImageFileField
        name="whatsappImage"
        label="WhatsApp image (500×500)"
        hint="Max 500KB"
        defaultValue={String(content.whatsappImage ?? "")}
        onValueChange={(value) => onPatch("whatsappImage", value)}
      />

      <label className={styles.subEventsToggleRow} style={{ alignItems: "center" }}>
        <input type="hidden" name="showWatchLive" value={showWatchLive ? "true" : "false"} />
        <span>
          <span className={ui.label}>Add Watch Live button</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showWatchLive}
          className={`${styles.toggleSwitch} ${showWatchLive ? styles.toggleSwitchOn : ""}`}
          onClick={() => onPatch("showWatchLive", !showWatchLive)}
        >
          <span className={styles.toggleKnob} />
        </button>
      </label>

      <label className={styles.subEventsToggleRow} style={{ alignItems: "center" }}>
        <input type="hidden" name="showSocialShare" value={showSocialShare ? "true" : "false"} />
        <span>
          <span className={ui.label}>Add social media share button</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showSocialShare}
          className={`${styles.toggleSwitch} ${showSocialShare ? styles.toggleSwitchOn : ""}`}
          onClick={() => onPatch("showSocialShare", !showSocialShare)}
        >
          <span className={styles.toggleKnob} />
        </button>
      </label>

      <div>
        <label className={ui.label} htmlFor="whatsappNumber">
          WhatsApp support number
        </label>
        <input
          id="whatsappNumber"
          name="whatsappNumber"
          className={ui.input}
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit number"
          value={String(content.whatsappNumber ?? "")}
          onChange={(e) => onPatch("whatsappNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </div>

      <div>
        <label className={ui.label} htmlFor="fontFamily">
          Font style
        </label>
        <select
          id="fontFamily"
          name="fontFamily"
          className={ui.input}
          value={String(content.fontFamily ?? "")}
          onChange={(e) => onPatch("fontFamily", e.target.value)}
        >
          <option value="">Select a font</option>
          {eventFontOptions.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={ui.label} htmlFor="fontColor">
          Font color
        </label>
        <input
          id="fontColor"
          name="fontColor"
          type="color"
          className={ui.input}
          value={/^#[0-9A-Fa-f]{6}$/.test(fontColor) ? fontColor : "#FFCC00"}
          onChange={(e) => onPatch("fontColor", e.target.value)}
          style={{ height: 40, padding: 4, maxWidth: 80 }}
        />
      </div>

      <div>
        <label className={ui.label} htmlFor="accessPin">
          PIN
        </label>
        <input
          id="accessPin"
          name="accessPin"
          className={ui.input}
          maxLength={8}
          placeholder="1234"
          value={String(content.accessPin ?? "")}
          onChange={(e) => onPatch("accessPin", e.target.value)}
          style={{ maxWidth: 120 }}
        />
      </div>
    </>
  );
}
