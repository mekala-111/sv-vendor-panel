/** Section toggles may live on the event/invitation doc or in themeConfig.customConfig
 * (customConfig is the production-safe store when Event schema lags behind). */
export function resolveThemeSectionToggles(raw: Record<string, unknown>) {
  const themeConfig =
    raw.themeConfig && typeof raw.themeConfig === "object"
      ? (raw.themeConfig as Record<string, unknown>)
      : null;
  const custom =
    themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
      ? (themeConfig.customConfig as Record<string, unknown>)
      : {};

  const pick = (key: "showSubEvents" | "showInvitationCard") => {
    if (custom[key] === false || custom[key] === true) return Boolean(custom[key]);
    if (raw[key] === false || raw[key] === true) return Boolean(raw[key]);
    return undefined;
  };

  return {
    showSubEvents: pick("showSubEvents"),
    showInvitationCard: pick("showInvitationCard"),
  };
}

export function withResolvedThemeSectionToggles(raw: Record<string, unknown>) {
  const themeConfig =
    raw.themeConfig && typeof raw.themeConfig === "object"
      ? (raw.themeConfig as Record<string, unknown>)
      : null;
  const custom =
    themeConfig?.customConfig && typeof themeConfig.customConfig === "object"
      ? (themeConfig.customConfig as Record<string, unknown>)
      : {};
  const toggles = resolveThemeSectionToggles(raw);
  return {
    ...raw,
    ...custom,
    ...(toggles.showSubEvents !== undefined ? { showSubEvents: toggles.showSubEvents } : {}),
    ...(toggles.showInvitationCard !== undefined
      ? { showInvitationCard: toggles.showInvitationCard }
      : {}),
  };
}
