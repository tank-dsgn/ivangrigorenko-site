import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/pot-menu-en" });

export default function Page() {
  return (
    <MenuPage
      lang="en"
      back="/pot-en"
      altMenu="/pot-menu-ru"
    />
  );
}
