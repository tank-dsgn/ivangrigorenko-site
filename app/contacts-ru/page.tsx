import { pageMetadata } from "@/lib/metadata";
import ContactsPage from "@/components/ContactsPage";

export const metadata = pageMetadata({ path: "/contacts-ru", title: "Контакты" });

export default function Page() {
  return <ContactsPage lang="ru" />;
}
