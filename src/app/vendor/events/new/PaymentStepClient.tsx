"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import ui from "@/components/ui.module.css";
import {
  fetchEventCreationPaymentConfig,
  submitPublishStep,
  submitQrEventPayment,
} from "@/lib/event-actions";
import styles from "./wizard.module.css";

type PaymentConfig = {
  amount: number;
  currency: string;
  free: boolean;
  payeeName: string;
  qrImage: string;
  instructions: string;
};

export function PaymentStepClient({
  eventId,
  eventName,
  fee,
}: {
  eventId: string;
  eventName: string;
  fee: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [utr, setUtr] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchEventCreationPaymentConfig();
        if (!cancelled) setConfig(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load payment QR settings.");
        }
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const amount = config?.amount ?? fee;

  async function onFreePublish() {
    setError("");
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("eventId", eventId);
        await submitPublishStep(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not publish.");
      }
    });
  }

  async function onSubmitProof() {
    setError("");
    if (!utr.trim() || utr.trim().length < 6) {
      setError("Enter a valid UTR / transaction ID (min 6 characters).");
      return;
    }
    if (!image) {
      setError("Upload a payment screenshot.");
      return;
    }
    startTransition(async () => {
      try {
        await submitQrEventPayment({
          eventId,
          utrNumber: utr.trim(),
          paymentImage: image,
        });
        setDone(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit payment.");
      }
    });
  }

  if (loadingConfig) {
    return <p style={{ fontSize: 13, color: "var(--muted-strong)" }}>Loading payment details…</p>;
  }

  if (amount <= 0 || config?.free) {
    return (
      <div className={styles.formGrid}>
        <div className={styles.feeBox}>
          <div className={styles.feeTitle}>Event creation fee</div>
          <div className={styles.feeAmount}>₹0</div>
          <p className={styles.feeHint}>No fee for your account. Publish to make the event live.</p>
        </div>
        {error ? (
          <p style={{ color: "#E4362B", fontSize: 13 }} role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className={styles.publishBtn} onClick={onFreePublish} disabled={pending}>
          {pending ? "Publishing…" : "Publish event"}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.feeBox}>
        <div className={styles.feeTitle}>Submitted for approval</div>
        <p className={styles.feeHint} style={{ marginBottom: 0 }}>
          Your UTR and payment screenshot for <strong>{eventName}</strong> were sent to admin. The
          event goes live after approval. If rejected, the event will not be published.
        </p>
        <button
          type="button"
          className={ui.btnDark}
          style={{ marginTop: 16 }}
          onClick={() => router.push(`/vendor/events/${eventId}`)}
        >
          Go to event
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formGrid}>
      <div className={styles.feeBox}>
        <div className={styles.feeTitle}>Event creation fee</div>
        <div className={styles.feeAmount}>₹{amount.toLocaleString("en-IN")}</div>
        {config?.payeeName ? (
          <p className={styles.feeHint} style={{ marginBottom: 8 }}>
            Pay to: <strong>{config.payeeName}</strong>
          </p>
        ) : null}
        <p className={styles.feeHint}>
          {config?.instructions ||
            "Scan the QR, pay the fee, then enter UTR and upload the payment screenshot. Admin approval makes the event live."}
        </p>
        {config?.qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.qrImage}
            alt="Payment QR"
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              margin: "12px auto 0",
              display: "block",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          />
        ) : (
          <p style={{ color: "#E4362B", fontSize: 13, marginTop: 10 }}>
            Admin has not uploaded a payment QR yet. Ask admin to set it under Settings → Payment.
          </p>
        )}
      </div>

      <div>
        <label className={ui.label} htmlFor="utrNumber">
          UTR / Transaction ID
        </label>
        <input
          id="utrNumber"
          className={ui.input}
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="e.g. 123456789012"
          autoComplete="off"
        />
      </div>

      <div>
        <label className={ui.label} htmlFor="paymentImage">
          Payment screenshot
        </label>
        <input
          id="paymentImage"
          type="file"
          accept="image/*"
          className={ui.input}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) {
              setError("Image must be under 4MB");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : "");
            reader.readAsDataURL(file);
          }}
        />
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Payment proof"
            style={{
              marginTop: 10,
              maxHeight: 160,
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          />
        ) : null}
      </div>

      {error ? (
        <p style={{ color: "#E4362B", fontSize: 13 }} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className={styles.publishBtn}
        onClick={onSubmitProof}
        disabled={pending || !config?.qrImage}
      >
        {pending ? "Submitting…" : "Submit payment for approval"}
      </button>
    </div>
  );
}
