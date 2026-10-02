import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/about-menu-en" });

export default function Page() {
  return (
    <MenuPage
      active="about"
      lang="en"
      back="/about-en"
      altMenu="/about-menu-ru"
    />
  );
}
