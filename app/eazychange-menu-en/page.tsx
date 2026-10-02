import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/eazychange-menu-en" });

export default function Page() {
  return (
    <MenuPage
      lang="en"
      back="/eazychange-en"
      altMenu="/eazychange-menu-ru"
    />
  );
}
