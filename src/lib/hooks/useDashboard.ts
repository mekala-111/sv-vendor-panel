/**
 * Dashboard data fetcher for vendor panel
 * Aggregates data from multiple backend endpoints to populate dashboard
 */

import { api } from "@/lib/api";

interface VendorProfile {
  id: string;
  companyName: string;
  email: string;
  wallet?: { balance: number };
}

export interface DashboardEventsSummary {
  status: string;
  count: number;
}

export interface DashboardRevenueSummary {
  totalRevenue: number;
  successfulPayments: number;
}

export interface DashboardEvent {
  id: string;
  name: string;
  status: "DRAFT" | "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  startTime: string;
  customerId: string;
  viewers?: number;
}

export interface DashboardCustomer {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface DashboardData {
  vendor: {
    id: string;
    companyName: string;
    email: string;
  };
  stats: {
    totalCustomers: number;
    totalEvents: number;
    liveEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    monthlyRevenue: number;
    walletBalance: number;
  };
  recentEvents: DashboardEvent[];
  recentCustomers: DashboardCustomer[];
}

/**
 * Fetch all dashboard data from backend
 * Called on the server to avoid exposing API calls to client
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    // Fetch vendor profile with wallet
    const vendorProfile = await api.get<VendorProfile>("/vendors/me");
    
    // Fetch events summary (counts by status)
    const eventsSummary = await api.get<DashboardEventsSummary[]>(
      "/reports/events-summary"
    );

    // Fetch revenue summary
    const revenueSummary = await api.get<DashboardRevenueSummary>(
      "/reports/revenue-summary"
    );

    // Fetch recent events (limit to 5 most recent)
    const eventsResponse = await api.getList<DashboardEvent>("/events", {
      params: { limit: 5 },
    });
    const recentEvents = eventsResponse.items;

    // Fetch customers (limit to 5 most recent)
    const customersResponse = await api.getList<DashboardCustomer>("/customers", {
      params: { limit: 5 },
    });
    const recentCustomers = customersResponse.items;

    // Calculate stats from summary data
    const eventCountByStatus = new Map<string, number>();
    eventsSummary.forEach((e) => {
      eventCountByStatus.set(e.status, e.count);
    });

    const stats = {
      totalCustomers: customersResponse.meta.total,
      totalEvents: eventsSummary.reduce((sum, e) => sum + e.count, 0),
      liveEvents: eventCountByStatus.get("LIVE") || 0,
      upcomingEvents: eventCountByStatus.get("UPCOMING") || 0,
      completedEvents: eventCountByStatus.get("COMPLETED") || 0,
      monthlyRevenue: revenueSummary.totalRevenue || 0,
      walletBalance: vendorProfile.wallet?.balance || 0,
    };

    return {
      vendor: {
        id: vendorProfile.id,
        companyName: vendorProfile.companyName || "SV Events",
        email: vendorProfile.email || "",
      },
      stats,
      recentEvents,
      recentCustomers,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return empty/fallback data instead of throwing
    return {
      vendor: {
        id: "",
        companyName: "SV Events",
        email: "",
      },
      stats: {
        totalCustomers: 0,
        totalEvents: 0,
        liveEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        monthlyRevenue: 0,
        walletBalance: 0,
      },
      recentEvents: [],
      recentCustomers: [],
    };
  }
}
