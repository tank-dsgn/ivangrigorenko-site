import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/about-ru";

export const metadata = pageMetadata({ path: "/about-ru", title: "Обо мне" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell} active="about">
      <Body />
    </SitePage>
  );
}
