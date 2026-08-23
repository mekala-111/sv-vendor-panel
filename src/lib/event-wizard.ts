export type EventWizardKind = "live" | "invitation";

export function parseWizardKind(raw?: string | string[] | null): EventWizardKind {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "invitation" ? "invitation" : "live";
}

export function wizardBasePath(kind: EventWizardKind) {
  return kind === "invitation" ? "/vendor/invitations/new" : "/vendor/events/new";
}

export function wizardListPath(kind: EventWizardKind) {
  return kind === "invitation" ? "/vendor/invitations" : "/vendor/events";
}

export function wizardMaxStep(_kind: EventWizardKind): number {
  return 5;
}

export function wizardStepLabels(
  kind: EventWizardKind,
  options?: { fromCustomer?: boolean }
): string[] {
  if (kind === "live" && options?.fromCustomer) {
    return ["Event Details", "Theme Content", "Payment", "Live Event Created"];
  }
  if (kind === "live") {
    return [
      "Event Details",
      "Select Theme",
      "Theme Content",
      "Payment",
      "Live Event Created",
    ];
  }
  return ["Event Details", "Theme", "Theme Content", "Event Page", "Payment"];
}

export function wizardDisplayStep(
  kind: EventWizardKind,
  internalStep: number,
  fromCustomer?: boolean
): number {
  if (kind !== "live" || !fromCustomer) return internalStep;
  if (internalStep <= 1) return 1;
  if (internalStep === 3) return 2;
  if (internalStep === 4) return 3;
  return 4;
}

export function wizardInternalStep(
  kind: EventWizardKind,
  displayStep: number,
  fromCustomer?: boolean
): number {
  if (kind !== "live" || !fromCustomer) return displayStep;
  if (displayStep <= 1) return 1;
  if (displayStep === 2) return 3;
  if (displayStep === 3) return 4;
  return 5;
}

export function parseWizardStep(raw: string | string[] | undefined, kind: EventWizardKind): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value ?? 1);
  const max = wizardMaxStep(kind);
  if (!Number.isFinite(n) || n < 1 || n > max) return 1;
  return n;
}

export function wizardTitle(kind: EventWizardKind) {
  return kind === "invitation" ? "Create Invitation" : "Create Live Event";
}

export function wizardStepUrl(
  kind: EventWizardKind,
  step: number,
  eventId?: string | null,
  extra?: Record<string, string | undefined>
) {
  const base = wizardBasePath(kind);
  const sp = new URLSearchParams();
  sp.set("step", String(step));
  if (eventId) sp.set("eventId", eventId);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) sp.set(key, value);
    }
  }
  return `${base}?${sp.toString()}`;
}

export function creationFeeForKind(
  profile:
    | {
        eventCreationFee?: number | null;
        liveEventCreationFee?: number | null;
        invitationCreationFee?: number | null;
      }
    | null
    | undefined,
  kind: EventWizardKind
) {
  const legacy = Number(profile?.eventCreationFee ?? 0);
  if (kind === "invitation") {
    return Number(profile?.invitationCreationFee ?? legacy);
  }
  return Number(profile?.liveEventCreationFee ?? legacy);
}
