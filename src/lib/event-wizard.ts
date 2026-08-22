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

export function wizardStepLabels(kind: EventWizardKind): string[] {
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
  eventId?: string | null
) {
  const base = wizardBasePath(kind);
  if (step === 1 && !eventId) return `${base}?step=1`;
  if (!eventId) return `${base}?step=1`;
  return `${base}?step=${step}&eventId=${encodeURIComponent(eventId)}`;
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
