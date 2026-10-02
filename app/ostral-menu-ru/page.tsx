import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/ostral-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      lang="ru"
      back="/ostral-ru"
      altMenu="/ostral-menu-en"
    />
  );
}
