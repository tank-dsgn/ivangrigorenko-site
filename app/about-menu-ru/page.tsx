import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/about-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      active="about"
      lang="ru"
      back="/about-ru"
      altMenu="/about-menu-en"
    />
  );
}
