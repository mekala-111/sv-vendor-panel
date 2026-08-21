// Shared UI constants for the SV Live Events Vendor Panel (status tones, static option lists).
// Actual data comes from the backend via src/lib/hooks/*.

export type StatusTone = { color: string; bg: string };

export const TONES = {
  green: { color: "#1E9E5A", bg: "rgba(30,158,90,0.12)" },
  red: { color: "#E4362B", bg: "rgba(228,54,43,0.12)" },
  yellow: { color: "#E0A324", bg: "rgba(224,163,36,0.12)" },
  blue: { color: "#3E7BD1", bg: "rgba(62,123,209,0.12)" },
  gray: { color: "#8A7E76", bg: "rgba(138,126,118,0.12)" },
} satisfies Record<string, StatusTone>;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  Active: "green",
  Inactive: "gray",
  Live: "red",
  Upcoming: "yellow",
  Completed: "green",
  Cancelled: "gray",
  Success: "green",
  Pending: "yellow",
  Refunded: "gray",
  Failed: "red",
  High: "red",
  Medium: "yellow",
  Low: "blue",
  Open: "red",
  Resolved: "green",
  Closed: "gray",
  Critical: "red",
  Credit: "green",
  Debit: "red",
  Refund: "gray",
  Adjustment: "blue",
};

export function statusTone(status: string): StatusTone {
  return TONES[STATUS_TONE[status] ?? "gray"];
}

export const eventTypeOptions = [
  "Wedding", "Engagement", "Reception", "Birthday", "Baby Shower", "Cradle Ceremony",
  "Church Event", "Devotional", "Gruhapravesham", "Sangeeth", "Seemantham", "Upanayanam", "General Event",
];

export const customerTabs = ["Overview", "Events", "Payments", "Activity"] as const;
export type CustomerTab = (typeof customerTabs)[number];

export const revenueBars = [30, 42, 38, 50, 44, 48, 55, 50, 58, 68, 80, 92];
