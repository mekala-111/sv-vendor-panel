import ui from "@/components/ui.module.css";
import { eventFontOptions, eventTypeOptions } from "@/lib/data";
import { filterThemesForWizardKind } from "@/lib/event-kind";
import { creationFeeForKind } from "@/lib/event-wizard";
import { fetchThemes, fetchVendorProfile, fetchYoutube } from "@/lib/server-data";
import { CreateEventWizard } from "./CreateEventWizard";
import { LiveEventSinglePageForm } from "./LiveEventSinglePageForm";

export default async function CreateLiveEventPage(props: PageProps<"/vendor/events/new">) {
  const sp = await props.searchParams;
  // Payment, back-to-edit and the customer flow still run through the step wizard.
  if (sp.step || sp.eventId || sp.fromCustomer) {
    return <CreateEventWizard kind="live" searchParams={props.searchParams} />;
  }

  const [themes, youtube, profile] = await Promise.all([fetchThemes(), fetchYoutube(), fetchVendorProfile()]);

  return (
    <>
      <h1 className={ui.pageTitle}>Create Live Event</h1>
      <LiveEventSinglePageForm
        themes={filterThemesForWizardKind(themes, "live").map((t) => ({
          id: t._id || t.slug,
          name: t.name,
          previewImage: t.previewImage,
          stripe1: t.stripe1,
          stripe2: t.stripe2,
          primary: t.primary,
          eventTypes: Array.isArray(t.config?.eventTypes) ? t.config.eventTypes : [],
        }))}
        eventTypes={eventTypeOptions}
        fonts={eventFontOptions}
        channels={youtube.channels.map((c) => ({ id: c.id, channelName: c.channelName }))}
        fee={creationFeeForKind(profile, "live")}
      />
    </>
  );
}
