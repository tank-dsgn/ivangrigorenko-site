import { pageMetadata } from "@/lib/metadata";
import MenuPage from "@/components/MenuPage";

export const metadata = pageMetadata({ path: "/ostral-menu-en" });

export default function Page() {
  return (
    <MenuPage
      lang="en"
      back="/ostral-en"
      altMenu="/ostral-menu-ru"
    />
  );
}
