import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/contacts-menu-en" });

export default function Page() {
  return (
    <MenuPage
      active="contacts"
      lang="en"
      back="/contacts-en"
      altMenu="/contacts-menu-ru"
    />
  );
}
