import Link from "next/link";
import type { EventWizardKind } from "@/lib/event-wizard";
import {
  wizardInternalStep,
  wizardStepLabels,
  wizardStepUrl,
} from "@/lib/event-wizard";
import styles from "./wizard.module.css";

export function WizardStepper({
  current,
  eventId,
  kind,
  fromCustomer = false,
  queryExtra,
}: {
  current: number;
  eventId?: string | null;
  kind: EventWizardKind;
  fromCustomer?: boolean;
  queryExtra?: Record<string, string | undefined>;
}) {
  const labels = wizardStepLabels(kind, { fromCustomer });

  return (
    <div className={styles.stepsRow}>
      {labels.map((label, index) => {
        const displayStep = index + 1;
        const internalStep = fromCustomer
          ? wizardInternalStep(kind, displayStep, true)
          : displayStep;
        const done = internalStep < current;
        const active = internalStep === current;
        const canJump = Boolean(eventId) && internalStep <= current;
        const href =
          canJump || (internalStep === 1 && !eventId)
            ? wizardStepUrl(kind, internalStep, eventId, queryExtra)
            : null;

        const circle = (
          <div
            className={styles.stepCircle}
            style={{
              background: done || active ? "var(--accent)" : "#E8E2DC",
              color: done || active ? "#fff" : "#9A9088",
            }}
          >
            {fromCustomer ? displayStep : internalStep}
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
