import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/eazychange-ru";

export const metadata = pageMetadata({ path: "/eazychange-ru", title: "Eazychange" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell}>
      <Body />
    </SitePage>
  );
}
