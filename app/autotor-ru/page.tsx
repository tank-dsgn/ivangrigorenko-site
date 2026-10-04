import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/autotor-ru";

export const metadata = pageMetadata({ path: "/autotor-ru", title: "autotor.pl" });

export default function Page() {
  return (
    <SitePage lang="ru" shell={shell}>
      <Body />
    </SitePage>
  );
}
