import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/pot-ru";

export const metadata = pageMetadata({ path: "/pot-ru", title: "POT" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell}>
      <Body />
    </SitePage>
  );
}
