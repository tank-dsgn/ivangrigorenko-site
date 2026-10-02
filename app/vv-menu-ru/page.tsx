import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/vv-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      lang="ru"
      back="/vv-ru"
      altMenu="/vv-menu-en"
    />
  );
}
