import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/home-menu-en" });

export default function Page() {
  return (
    <MenuPage
      active="work"
      lang="en"
      back="/"
      altMenu="/home-menu-ru"
    />
  );
}
