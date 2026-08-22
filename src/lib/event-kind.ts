import type { EventWizardKind } from "./event-wizard";

/** Layouts intended for live streaming — hidden from invitation wizard. */
const LIVE_STREAMING_LAYOUTS = new Set(["cinematic", "classic", "traditional-streaming"]);

function isLiveStreamingLayout(layout: string) {
  if (!layout) return false;
  if (LIVE_STREAMING_LAYOUTS.has(layout)) return true;
  return layout.includes("streaming") && !layout.includes("wedding");
}

export type EventKindRow = {
  showWatchLive?: boolean | null;
  themeId?: string | null;
};

export function isLiveThemeLayout(layout: string) {
  return isLiveStreamingLayout(layout);
}

export function filterThemesForWizardKind<
  T extends { layout?: string; config?: { layout?: string } },
>(themes: T[], kind: EventWizardKind): T[] {
  if (kind === "live") {
    return themes;
  }
  return themes.filter((theme) => {
    const layout = theme.config?.layout || theme.layout || "";
    if (!layout) return true;
    return !isLiveStreamingLayout(layout);
  });
}

export function buildThemeLayoutMap(
  themes: { _id?: string; layout?: string; config?: { layout?: string } }[]
) {
  const map = new Map<string, string>();
  for (const theme of themes) {
    const id = theme._id;
    if (!id) continue;
    const layout = theme.config?.layout || theme.layout || "";
    if (layout) map.set(id, layout);
  }
  return map;
}

export function isLiveEvent(event: EventKindRow, themeLayoutById: Map<string, string>) {
  const layout = event.themeId ? themeLayoutById.get(event.themeId) : undefined;
  if (layout) {
    if (isLiveStreamingLayout(layout)) return true;
    if (
      layout.includes("wedding") ||
      layout === "traditional" ||
      layout === "floral" ||
      layout === "the-sacred-garden" ||
      layout.includes("sacred-garden") ||
      layout === "spiritual" ||
      layout === "birthday" ||
      layout === "minimal"
    ) {
      return false;
    }
  }
  return event.showWatchLive !== false;
}

export function isInvitationEvent(event: EventKindRow, themeLayoutById: Map<string, string>) {
  return !isLiveEvent(event, themeLayoutById);
}
