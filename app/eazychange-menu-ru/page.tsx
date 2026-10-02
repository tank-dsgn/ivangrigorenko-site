import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/eazychange-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      lang="ru"
      back="/eazychange-ru"
      altMenu="/eazychange-menu-en"
    />
  );
}
