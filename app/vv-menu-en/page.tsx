import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/vv-menu-en" });

export default function Page() {
  return (
    <MenuPage
      lang="en"
      back="/vv-en"
      altMenu="/vv-menu-ru"
    />
  );
}
