import { pageMetadata } from "@/lib/metadata";
import ContactsPage from "@/components/ContactsPage";

export const metadata = pageMetadata({ path: "/contacts-en", title: "Contacts" });

export default function Page() {
  return <ContactsPage lang="en" />;
}
