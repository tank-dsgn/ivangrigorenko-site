import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/autotor-menu-ru" });

export default function Page() {
  return (
    <MenuPage
      lang="ru"
      back="/autotor-ru"
      altMenu="/autotor-menu-en"
    />
  );
}
