"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ui from "@/components/ui.module.css";
import {
  getConfiguredPublicEventBase,
  isLoopbackPublicBase,
  resolveScannablePublicEventUrl,
} from "@/lib/public-event-url";
import styles from "./wizard.module.css";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={ui.btnPrimary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function RevealStreamKey({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [reveal, setReveal] = useState(false);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        name={name}
        type={reveal ? "text" : "password"}
        className={ui.input}
        defaultValue={defaultValue}
        placeholder="••••••••••••••••"
        autoComplete="off"
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className={ui.btnPrimary}
        style={{ background: "#fff", color: "var(--dark)", border: "1px solid var(--border)" }}
        onClick={() => setReveal((v) => !v)}
      >
        {reveal ? "Hide" : "Reveal"}
      </button>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CoverImageDropzone({
  name = "coverImage",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div>
      <input type="hidden" name={name} value={preview} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
        }}
      />
      <button
        type="button"
        className={`${styles.coverDrop} ${dragging ? styles.coverDropActive : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) readFile(file);
        }}
        style={
          preview
            ? {
                backgroundImage: `url(${preview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!preview ? <span>drop cover image here</span> : <span className={styles.coverChange}>Change image</span>}
      </button>
    </div>
  );
}

export function ImageFileField({
  name,
  label,
  hint,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxBytes = 512000,
  defaultValue = "",
}: {
  name: string;
  label: string;
  hint?: string;
  accept?: string;
  maxBytes?: number;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  return (
    <div>
      <label className={ui.label} htmlFor={name}>
        {label}
      </label>
      {hint ? <div className={styles.fieldHint}>{hint}</div> : null}
      <input type="hidden" name={name} value={value} />
      <input
        id={name}
        type="file"
        accept={accept}
        className={ui.input}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > maxBytes) {
            setError(`File too large (${Math.round(file.size / 1024)}KB > ${Math.round(maxBytes / 1024)}KB).`);
            e.target.value = "";
            return;
          }
          if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            e.target.value = "";
            return;
          }
          setError("");
          setValue(await readAsDataUrl(file));
        }}
      />
      {error ? <div className={styles.fieldError}>{error}</div> : null}
      {value ? (
        <div className={styles.thumbRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={styles.thumb} />
          <button type="button" className={ui.btnOutlineSm} onClick={() => setValue("")}>
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function GalleryImagesField({
  name = "galleryImages",
  defaultValue = [],
  max = 20,
}: {
  name?: string;
  defaultValue?: string[];
  max?: number;
}) {
  const [images, setImages] = useState<string[]>(defaultValue);
  const [error, setError] = useState("");

  return (
    <div>
      <label className={ui.label}>Gallery images</label>
      <div className={styles.fieldHint}>Max {max} files · JPEG/JPG/PNG/WebP · up to 4MB each</div>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className={ui.input}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          const next = [...images];
          for (const file of files) {
            if (next.length >= max) {
              setError(`Maximum ${max} images allowed.`);
              break;
            }
            if (file.size > 4 * 1024 * 1024) {
              setError(`Skipped ${file.name}: exceeds 4MB.`);
              continue;
            }
            if (!file.type.startsWith("image/")) {
              setError(`Skipped ${file.name}: image files only.`);
              continue;
            }
            next.push(await readAsDataUrl(file));
            setError("");
          }
          setImages(next.slice(0, max));
          e.target.value = "";
        }}
      />
      {error ? <div className={styles.fieldError}>{error}</div> : null}
      {images.length ? (
        <div className={styles.galleryGrid}>
          {images.map((src, i) => (
            <div key={`${i}-${src.slice(0, 24)}`} className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button
                type="button"
                className={styles.galleryRemove}
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type SubEventRow = { title: string; date: string; time: string; place: string };

export function SubEventsField({
  name = "subEvents",
  defaultValue = [],
}: {
  name?: string;
  defaultValue?: Partial<SubEventRow>[];
}) {
  const [rows, setRows] = useState<SubEventRow[]>(() =>
    (defaultValue.length
      ? defaultValue
      : [{ title: "", date: "", time: "", place: "" }]
    ).map((r) => ({
      title: String(r.title ?? ""),
      date: String(r.date ?? ""),
      time: String(r.time ?? ""),
      place: String(r.place ?? ""),
    }))
  );

  return (
    <div>
      <div className={ui.label} style={{ marginBottom: 8 }}>
        Sub events
      </div>
      <div className={styles.fieldHint}>e.g. Haldi, Mehendi, Sangeet, Reception</div>
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.title.trim()))} />
      <div className={styles.subEventList}>
        {rows.map((row, index) => (
          <div key={index} className={styles.subEventCard}>
            <div className={styles.subEventHead}>
              <span>Event {index + 1}</span>
              {rows.length > 1 ? (
                <button
                  type="button"
                  className={styles.galleryRemove}
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Remove sub event"
                >
                  ×
                </button>
              ) : null}
            </div>
            <input
              className={ui.input}
              placeholder="Title (Haldi / Wedding / Reception)"
              value={row.title}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, title: e.target.value } : r))
                )
              }
            />
            <div className={ui.grid2}>
              <input
                className={ui.input}
                type="date"
                value={row.date}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, date: e.target.value } : r))
                  )
                }
              />
              <input
                className={ui.input}
                placeholder="Time (e.g. 6:00 PM)"
                value={row.time}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, time: e.target.value } : r))
                  )
                }
              />
            </div>
            <input
              className={ui.input}
              placeholder="Place / venue"
              value={row.place}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, place: e.target.value } : r))
                )
              }
            />
          </div>
        ))}
      </div>
      {rows.length < 20 ? (
        <button
          type="button"
          className={ui.btnOutlineSm}
          style={{ marginTop: 10 }}
          onClick={() =>
            setRows((prev) => [...prev, { title: "", date: "", time: "", place: "" }])
          }
        >
          + Add sub event
        </button>
      ) : null}
    </div>
  );
}

export function DomainSlugInput({
  name = "eventSlug",
  defaultValue = "",
  disabled = false,
}: {
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <input
      id={name}
      name={name}
      className={ui.inputMono}
      value={value}
      disabled={disabled}
      required
      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
      title="Lowercase letters and numbers only (no spaces)"
      placeholder="raviwedsrani"
      onChange={(e) => {
        const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
        setValue(cleaned);
      }}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").toLowerCase().replace(/[^a-z0-9-]/g, "");
        setValue(text);
      }}
    />
  );
}

/** Real scannable QR for the public event URL (uses /event/{slug}). */
export function EventPageQr({
  slug,
  isPublished = false,
}: {
  slug: string;
  isPublished?: boolean;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!slug) {
      setUrl("");
      return;
    }
    setUrl(resolveScannablePublicEventUrl(slug));
  }, [slug]);

  if (!slug || !url) return null;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;

  return (
    <div className={styles.linkBlock} style={{ marginTop: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt="Event page QR"
        width={96}
        height={96}
        className={styles.qrBox}
        style={{ objectFit: "contain", background: "#fff", padding: 4 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={styles.linkRow}>
          <div className={styles.linkDisplay}>{url.replace(/^https?:\/\//, "")}</div>
          <CopyLinkButton value={url} />
        </div>
        {!isPublished ? (
          <div className={styles.fieldHint} style={{ marginTop: 8 }}>
            Guests can open this QR only after payment is approved and the event is published.
          </div>
        ) : null}
        {isLoopbackPublicBase(getConfiguredPublicEventBase()) ? (
          <div className={styles.fieldHint} style={{ marginTop: 6, color: "#B7791F" }}>
            For phone scan, open vendor panel via Wi‑Fi IP (not localhost), and run the public site
            on port 3002 on that same machine.
          </div>
        ) : null}
      </div>
    </div>
  );
}
