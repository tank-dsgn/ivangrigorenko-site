import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/home-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      active="work"
      lang="ru"
      back="/home-ru"
      altMenu="/home-menu-en"
    />
  );
}
