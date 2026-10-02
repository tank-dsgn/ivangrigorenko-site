import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/mikulich-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      lang="ru"
      back="/mikulich-ru"
      altMenu="/mikulich-menu-en"
    />
  );
}
