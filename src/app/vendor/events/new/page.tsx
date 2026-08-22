import { CreateEventWizard } from "./CreateEventWizard";

export default function CreateLiveEventPage(props: PageProps<"/vendor/events/new">) {
  return <CreateEventWizard kind="live" searchParams={props.searchParams} />;
}
