import ui from "@/components/ui.module.css";
import { fetchCustomers } from "@/lib/hooks/useCustomers";
import { fetchVendorThemes } from "@/lib/hooks/useThemes";
import { fetchYoutubeChannels } from "@/lib/hooks/useYoutube";
import { eventTypeOptions } from "@/lib/data";
import { EventWizard } from "./EventWizard";

function toParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function CreateEventPage(props: PageProps<"/vendor/events/new">) {
  const params = await props.searchParams;
  const initialThemeId = toParam(params.themeId);

  const [customersResult, themeAssignments, channels] = await Promise.all([
    fetchCustomers({ limit: 100 }),
    fetchVendorThemes().catch(() => []),
    fetchYoutubeChannels().catch(() => []),
  ]);

  return (
    <>
      <h1 className={ui.pageTitle}>Create Event</h1>
      <EventWizard
        customers={customersResult.items.map((c) => ({ id: c.id, name: c.name }))}
        eventTypeOptions={eventTypeOptions}
        themes={themeAssignments.map((a) => a.theme)}
        channels={channels.filter((c) => c.status === "CONNECTED")}
        initialThemeId={initialThemeId}
      />
    </>
  );
}
