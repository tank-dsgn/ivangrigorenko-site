import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/autotor-menu-en" });

export default function Page() {
  return (
    <MenuPage
      lang="en"
      back="/autotor-en"
      altMenu="/autotor-menu-ru"
    />
  );
}
