import { CreateEventWizard } from "../../events/new/CreateEventWizard";

export default function CreateInvitationPage(props: PageProps<"/vendor/invitations/new">) {
  return <CreateEventWizard kind="invitation" searchParams={props.searchParams} />;
}
