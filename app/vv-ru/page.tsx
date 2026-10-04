import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/vv-ru";

export const metadata = pageMetadata({ path: "/vv-ru", title: "Дизайн-система" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell}>
      <Body />
    </SitePage>
  );
}
