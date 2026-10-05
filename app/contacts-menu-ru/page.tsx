import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/contacts-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      active="contacts"
      lang="ru"
      back="/contacts-ru"
      altMenu="/contacts-menu-en"
    />
  );
}
