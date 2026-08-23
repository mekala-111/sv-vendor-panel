import { AddCustomerWizard } from "./AddCustomerWizard";

export default function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AddCustomerWizard searchParams={searchParams} />;
}
