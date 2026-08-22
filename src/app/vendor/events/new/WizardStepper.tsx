import Link from "next/link";
import type { EventWizardKind } from "@/lib/event-wizard";
import { wizardStepLabels, wizardStepUrl } from "@/lib/event-wizard";
import styles from "./wizard.module.css";

export function WizardStepper({
  current,
  eventId,
  kind,
}: {
  current: number;
  eventId?: string | null;
  kind: EventWizardKind;
}) {
  return (
    <div className={styles.stepsRow}>
      {wizardStepLabels(kind).map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        const canJump = Boolean(eventId) && step <= current;
        const href = canJump || (step === 1 && !eventId) ? wizardStepUrl(kind, step, eventId) : null;

        const circle = (
          <div
            className={styles.stepCircle}
            style={{
              background: done || active ? "var(--accent)" : "#E8E2DC",
              color: done || active ? "#fff" : "#9A9088",
            }}
          >
            {step}
          </div>
        );

        return (
          <div key={label} className={styles.step}>
            {canJump && href ? (
              <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
                {circle}
                <div
                  className={styles.stepLabel}
                  style={{ color: active ? "var(--dark)" : done ? "var(--muted-strong)" : "#B0A7A0" }}
                >
                  {label}
                </div>
              </Link>
            ) : (
              <>
                {circle}
                <div
                  className={styles.stepLabel}
                  style={{ color: active ? "var(--dark)" : done ? "var(--muted-strong)" : "#B0A7A0" }}
                >
                  {label}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
