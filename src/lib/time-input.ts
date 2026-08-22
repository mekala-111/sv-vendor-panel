/** Normalize stored time strings (24h or "6:00 PM") for HTML `type="time"` inputs. */
export function normalizeTimeForInput(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) return v.slice(0, 5);
  const match = v.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = match[2];
  const isPm = match[3].toUpperCase() === "PM";
  if (isPm && hours < 12) hours += 12;
  if (!isPm && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}
