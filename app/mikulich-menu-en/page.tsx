import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/mikulich-menu-en" });

export default function Page() {
  return (
    <MenuPage
      lang="en"
      back="/mikulich-en"
      altMenu="/mikulich-menu-ru"
    />
  );
}
