import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/pot-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      lang="ru"
      back="/pot-ru"
      altMenu="/pot-menu-en"
    />
  );
}
