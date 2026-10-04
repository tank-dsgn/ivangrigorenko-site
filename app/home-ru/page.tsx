import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/home-ru";

export const metadata = pageMetadata({ path: "/home-ru" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell} active="work">
      <Body />
    </SitePage>
  );
}
