// Mock data layer for the SV Live Events Vendor Panel.
// Ported from the Claude Design prototype (Vendor Panel.dc.html).
// Frontend-only sample data — no backend.

export type StatusTone = { color: string; bg: string };

export const TONES = {
  green: { color: "#1E9E5A", bg: "rgba(30,158,90,0.12)" },
  red: { color: "#E4362B", bg: "rgba(228,54,43,0.12)" },
  yellow: { color: "#E0A324", bg: "rgba(224,163,36,0.12)" },
  blue: { color: "#3E7BD1", bg: "rgba(62,123,209,0.12)" },
  gray: { color: "#8A7E76", bg: "rgba(138,126,118,0.12)" },
} satisfies Record<string, StatusTone>;

export interface CustomerEvent {
  name: string;
  date: string;
}
export interface CustomerPayment {
  desc: string;
  amount: string;
}
export interface CustomerActivity {
  text: string;
  time: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  events: number;
  spend: string;
  status: "Active" | "Inactive";
  joined: string;
  eventsList: CustomerEvent[];
  paymentsList: CustomerPayment[];
  activity: CustomerActivity[];
}

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
  Credit: "green",
  Debit: "red",
};

export function statusTone(status: string): StatusTone {
  return TONES[STATUS_TONE[status] ?? "gray"];
}

export const customers: Customer[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    events: 3,
    spend: "₹42,000",
    status: "Active",
    joined: "Jan 2025",
    eventsList: [
      { name: "Rahul & Priya Wedding", date: "May 24, 2025" },
      { name: "Engagement Ceremony", date: "Feb 10, 2025" },
      { name: "Sangeet Night", date: "Feb 09, 2025" },
    ],
    paymentsList: [
      { desc: "Event booking — Wedding", amount: "₹42,000" },
      { desc: "Add-on: Extra camera", amount: "₹5,000" },
    ],
    activity: [
      { text: "Booked new event: Rahul & Priya Wedding", time: "2 days ago" },
      { text: "Made payment of ₹42,000", time: "2 days ago" },
    ],
  },
  {
    id: 2,
    name: "XYZ Pvt Ltd",
    email: "events@xyzpvt.com",
    events: 6,
    spend: "₹1,86,000",
    status: "Active",
    joined: "Nov 2024",
    eventsList: [
      { name: "Annual Business Conference", date: "May 24, 2025" },
      { name: "Product Launch Event", date: "May 26, 2025" },
    ],
    paymentsList: [{ desc: "Event booking — Conference", amount: "₹1,86,000" }],
    activity: [{ text: "Booked new event: Annual Business Conference", time: "5 days ago" }],
  },
  {
    id: 3,
    name: "Sri Temple Trust",
    email: "admin@sritempletrust.org",
    events: 2,
    spend: "₹28,500",
    status: "Active",
    joined: "Mar 2025",
    eventsList: [{ name: "Temple Festival 2025", date: "May 23, 2025" }],
    paymentsList: [{ desc: "Event booking — Festival", amount: "₹28,500" }],
    activity: [{ text: "Event completed: Temple Festival 2025", time: "1 day ago" }],
  },
  {
    id: 4,
    name: "Tone Media",
    email: "bookings@tonemedia.in",
    events: 4,
    spend: "₹94,200",
    status: "Active",
    joined: "Dec 2024",
    eventsList: [{ name: "Music Concert Live", date: "May 23, 2025" }],
    paymentsList: [{ desc: "Event booking — Concert", amount: "₹94,200" }],
    activity: [{ text: "Made payment of ₹94,200", time: "3 days ago" }],
  },
  {
    id: 5,
    name: "Anita Patel",
    email: "anita.patel@yahoo.com",
    events: 1,
    spend: "₹18,000",
    status: "Inactive",
    joined: "Apr 2025",
    eventsList: [{ name: "Birthday Celebration", date: "May 22, 2025" }],
    paymentsList: [{ desc: "Event booking — Birthday", amount: "₹18,000" }],
    activity: [{ text: "Event completed: Birthday Celebration", time: "4 days ago" }],
  },
  {
    id: 6,
    name: "Vikram Singh",
    email: "vikram.singh@gmail.com",
    events: 2,
    spend: "₹56,000",
    status: "Active",
    joined: "Feb 2025",
    eventsList: [{ name: "Birthday Party Live", date: "May 25, 2025" }],
    paymentsList: [{ desc: "Event booking — Party", amount: "₹56,000" }],
    activity: [{ text: "Booked new event: Birthday Party Live", time: "6 hours ago" }],
  },
  {
    id: 7,
    name: "Kiran & Pooja",
    email: "kiranpooja.wedding@gmail.com",
    events: 1,
    spend: "₹1,20,000",
    status: "Active",
    joined: "Jan 2025",
    eventsList: [{ name: "Engagement Ceremony", date: "May 27, 2025" }],
    paymentsList: [{ desc: "Event booking — Engagement", amount: "₹1,20,000" }],
    activity: [{ text: "Booked new event: Engagement Ceremony", time: "1 day ago" }],
  },
  {
    id: 8,
    name: "Greenwood School",
    email: "events@greenwoodschool.edu",
    events: 1,
    spend: "₹32,000",
    status: "Active",
    joined: "Mar 2025",
    eventsList: [{ name: "School Annual Day", date: "May 28, 2025" }],
    paymentsList: [{ desc: "Event booking — Annual Day", amount: "₹32,000" }],
    activity: [{ text: "Booked new event: School Annual Day", time: "2 days ago" }],
  },
];

export interface EventRecord {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  customer: string;
  status: "Live" | "Upcoming" | "Completed";
  viewers: string;
  revenue: string;
}

export const events: EventRecord[] = [
  { id: 1, name: "Rahul & Priya Wedding", date: "May 24", time: "7:00 PM", location: "Hyderabad", customer: "Rahul Sharma", status: "Live", viewers: "2,481", revenue: "₹42,000" },
  { id: 2, name: "Annual Business Conference", date: "May 24", time: "9:00 AM", location: "Bangalore", customer: "XYZ Pvt Ltd", status: "Live", viewers: "1,240", revenue: "₹1,86,000" },
  { id: 3, name: "Temple Festival 2025", date: "May 23", time: "6:00 PM", location: "Tirupati", customer: "Sri Temple Trust", status: "Completed", viewers: "5,832", revenue: "₹28,500" },
  { id: 4, name: "Music Concert Live", date: "May 23", time: "8:00 PM", location: "Mumbai", customer: "Tone Media", status: "Live", viewers: "3,421", revenue: "₹94,200" },
  { id: 5, name: "Birthday Party Live", date: "May 25", time: "7:00 AM", location: "Pune", customer: "Vikram Singh", status: "Upcoming", viewers: "—", revenue: "₹18,000" },
  { id: 6, name: "Product Launch Event", date: "May 26", time: "10:00 AM", location: "Delhi", customer: "Tech Innovators", status: "Upcoming", viewers: "—", revenue: "₹2,10,000" },
  { id: 7, name: "Engagement Ceremony", date: "May 27", time: "6:00 PM", location: "Jaipur", customer: "Kiran & Pooja", status: "Upcoming", viewers: "—", revenue: "₹1,20,000" },
  { id: 8, name: "Birthday Celebration", date: "May 22", time: "7:30 PM", location: "Chennai", customer: "Anita Patel", status: "Completed", viewers: "856", revenue: "₹18,000" },
];

export interface VendorTheme {
  slug: string;
  name: string;
  stripe1: string;
  stripe2: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const vendorThemes: VendorTheme[] = [
  { slug: "wedding-elegant", name: "Wedding Elegant", stripe1: "#F3D9C0", stripe2: "#EAC29A", primary: "#C77B3E", secondary: "#F3D9C0", accent: "#8A5A2E" },
  { slug: "wedding-royal", name: "Wedding Royal", stripe1: "#D9C6EC", stripe2: "#C7A8E0", primary: "#6B3FA0", secondary: "#D9C6EC", accent: "#4A2A70" },
  { slug: "corporate", name: "Corporate", stripe1: "#C4D6EE", stripe2: "#A9C1E5", primary: "#2C5AA0", secondary: "#C4D6EE", accent: "#1D3E73" },
  { slug: "concert", name: "Concert", stripe1: "#3A2A45", stripe2: "#251A2E", primary: "#8B3FA0", secondary: "#3A2A45", accent: "#E4362B" },
  { slug: "spiritual", name: "Spiritual", stripe1: "#F5D98B", stripe2: "#E8C46B", primary: "#C9962F", secondary: "#F5D98B", accent: "#8A5A0E" },
  { slug: "birthday", name: "Birthday", stripe1: "#F5C6D0", stripe2: "#EBA8B7", primary: "#E0567A", secondary: "#F5C6D0", accent: "#B23A5C" },
  { slug: "minimal", name: "Minimal", stripe1: "#E5E0DA", stripe2: "#D2CBC2", primary: "#3A322C", secondary: "#E5E0DA", accent: "#8A7E76" },
];

export const eventTypeOptions = [
  "Wedding", "Engagement", "Reception", "Birthday", "Baby Shower", "Cradle Ceremony",
  "Church Event", "Devotional", "Gruhapravesham", "Sangeeth", "Seemantham", "Upanayanam", "General Event",
];

export const eventQuickActions = ["Preview", "Copy Link", "QR Code", "Edit", "Change Theme", "YouTube", "Share"];

export const eventDetailTabs = ["Overview", "YouTube", "Theme", "Event Page", "Viewers", "Recording", "Analytics", "Settings"] as const;
export type EventDetailTab = (typeof eventDetailTabs)[number];

export function eventDetailTabContent(ev: EventRecord, tab: EventDetailTab): string {
  const slug = ev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  switch (tab) {
    case "Overview":
      return `${ev.customer} · ${ev.location} · ${ev.viewers} viewers · Revenue ${ev.revenue}`;
    case "YouTube":
      return "Connected channel: SV Events Live · Stream status: " + ev.status;
    case "Theme":
      return "Applied theme: Wedding Elegant";
    case "Event Page":
      return "events.svevents.in/" + slug;
    case "Viewers":
      return ev.viewers + " unique viewers so far";
    case "Recording":
      return ev.status === "Completed" ? "Recording available for download" : "Recording will be available after the event ends";
    case "Analytics":
      return "Peak concurrent viewers, watch time, and engagement stats for this event";
    case "Settings":
      return "Manage visibility, access, and notification preferences for this event";
  }
}

export const customerTabs = ["Overview", "Events", "Payments", "Activity"] as const;
export type CustomerTab = (typeof customerTabs)[number];

export const walletBalance = "₹24,680.00";

export const walletTx = [
  { desc: "Event charge — Rahul & Priya Wedding", type: "Debit", amount: "-₹4,200", date: "May 24" },
  { desc: "Wallet top-up via UPI", type: "Credit", amount: "+₹10,000", date: "May 20" },
  { desc: "Event charge — Music Concert Live", type: "Debit", amount: "-₹3,100", date: "May 19" },
  { desc: "Referral credit", type: "Credit", amount: "+₹500", date: "May 15" },
  { desc: "Event charge — Temple Festival 2025", type: "Debit", amount: "-₹2,800", date: "May 12" },
] as const;

export const paymentStats = [
  { label: "Customer Payments", value: "₹4,68,700", color: "#211A15" },
  { label: "Event Payments", value: "₹1,42,860", color: "#1E9E5A" },
  { label: "Pending", value: "₹18,000", color: "#E0A324" },
  { label: "Refunds", value: "₹12,500", color: "#E4362B" },
];

export const vendorPayments = [
  { customer: "Rahul Sharma", event: "Rahul & Priya Wedding", amount: "₹42,000", status: "Success", date: "May 24" },
  { customer: "XYZ Pvt Ltd", event: "Annual Business Conference", amount: "₹1,86,000", status: "Success", date: "May 24" },
  { customer: "Sri Temple Trust", event: "Temple Festival 2025", amount: "₹28,500", status: "Success", date: "May 23" },
  { customer: "Tone Media", event: "Music Concert Live", amount: "₹94,200", status: "Success", date: "May 23" },
  { customer: "Anita Patel", event: "Birthday Celebration", amount: "₹18,000", status: "Pending", date: "May 22" },
  { customer: "Vikram Singh", event: "Birthday Party Live", amount: "₹56,000", status: "Refunded", date: "May 21" },
] as const;

export const vendorPricing = [
  { name: "Wedding Event", price: "₹999" },
  { name: "Corporate Event", price: "₹1,499" },
  { name: "Premium Event", price: "₹2,499" },
  { name: "General Event", price: "₹699" },
];

export const vendorTickets = [
  { id: "TCK-102", issue: "Payment not reflecting in wallet", priority: "High", status: "Open" },
  { id: "TCK-098", issue: "YouTube stream keeps dropping", priority: "High", status: "Pending" },
  { id: "TCK-091", issue: "Theme colors not saving", priority: "Low", status: "Resolved" },
  { id: "TCK-085", issue: "Need help adding a new customer", priority: "Medium", status: "Closed" },
] as const;

export const settingsCards = [
  { title: "General", fields: [
    { k: "Company Name", v: "SV Events" },
    { k: "Phone", v: "+91 98765 43210" },
    { k: "Email", v: "contact@svevents.in" },
    { k: "Address", v: "Hyderabad, India" },
  ]},
  { title: "WhatsApp Support", fields: [
    { k: "Support Number", v: "+91 98765 43210" },
    { k: "Button on Event Pages", v: "Enabled" },
  ]},
  { title: "Notifications", fields: [
    { k: "Email", v: "Enabled" },
    { k: "SMS", v: "Enabled" },
    { k: "Push", v: "Disabled" },
  ]},
  { title: "Security", fields: [
    { k: "2FA", v: "Enabled" },
    { k: "Password Last Changed", v: "32 days ago" },
    { k: "Active Sessions", v: "2" },
  ]},
];

export const dashboardStats = [
  { label: "Total Customers", value: "248", delta: "▲ 12.5%", color: "#3E7BD1" },
  { label: "Total Events", value: "156", delta: "▲ 18.2%", color: "#3E7BD1" },
  { label: "Live Events", value: "8", delta: "▲ 33.3%", color: "#E4362B" },
  { label: "Upcoming Events", value: "24", delta: "▲ 14.3%", color: "#E0A324" },
  { label: "Completed Events", value: "124", delta: "▲ 10.5%", color: "#1E9E5A" },
  { label: "Monthly Revenue", value: "₹1,85,420", delta: "▲ 22.8%", color: "#F5820B" },
];

export const revenueBars = [30, 42, 38, 50, 44, 48, 55, 50, 58, 68, 80, 92];

export const liveEvents = [
  { name: "Rahul & Priya Wedding", location: "Hyderabad", viewers: "2,481 watching" },
  { name: "Annual Business Conference", location: "Bangalore", viewers: "1,240 watching" },
  { name: "Temple Festival 2025", location: "Tirupati", viewers: "5,832 watching" },
  { name: "Music Concert Live", location: "Mumbai", viewers: "3,421 watching" },
];

export const recentEvents = [
  { name: "Rahul & Priya Wedding", datetime: "May 24, 7:00 PM", customer: "Rahul Sharma", status: "Live", viewers: "2,481" },
  { name: "Annual Business Conference", datetime: "May 24, 9:00 AM", customer: "XYZ Pvt Ltd", status: "Live", viewers: "1,240" },
  { name: "Temple Festival 2025", datetime: "May 23, 6:00 PM", customer: "Sri Temple Trust", status: "Completed", viewers: "5,832" },
  { name: "Music Concert Live", datetime: "May 23, 8:00 PM", customer: "Tone Media", status: "Live", viewers: "3,421" },
  { name: "Birthday Celebration", datetime: "May 22, 7:30 PM", customer: "Anita Patel", status: "Completed", viewers: "856" },
] as const;

export const upcomingEvents = [
  { month: "MAY", day: "25", name: "Birthday Party Live", time: "7:00 AM", customer: "Vikram Singh" },
  { month: "MAY", day: "26", name: "Product Launch Event", time: "10:00 AM", customer: "Tech Innovators" },
  { month: "MAY", day: "27", name: "Engagement Ceremony", time: "6:00 PM", customer: "Kiran & Pooja" },
  { month: "MAY", day: "28", name: "School Annual Day", time: "9:00 AM", customer: "Greenwood School" },
  { month: "MAY", day: "29", name: "Wedding Reception", time: "7:00 PM", customer: "Amit & Neha" },
];

export const notifications = [
  { text: "Payment received from Rahul Sharma", time: "10 minutes ago", color: "#1E9E5A" },
  { text: 'Event "Rahul & Priya Wedding" is now LIVE', time: "15 minutes ago", color: "#E4362B" },
  { text: "YouTube stream connected successfully", time: "30 minutes ago", color: "#3E7BD1" },
  { text: "New customer registered: Vikram Singh", time: "1 hour ago", color: "#8A5CF5" },
  { text: "YouTube stream disconnected for an event", time: "2 hours ago", color: "#E4362B" },
];

export const ytEvents = events.slice(0, 5).map((e) => ({
  name: e.name,
  ytStatus: e.status === "Live" ? "🔴 Live" : e.status === "Completed" ? "⚫ Ended" : "🟡 Scheduled",
}));

export const wizardStepLabels = ["Event Details", "YouTube", "Theme", "Event Page", "Publish"];

export function getCustomer(id: number): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getEvent(id: number): EventRecord | undefined {
  return events.find((e) => e.id === id);
}

export function getTheme(slug: string): VendorTheme | undefined {
  return vendorThemes.find((t) => t.slug === slug);
}
