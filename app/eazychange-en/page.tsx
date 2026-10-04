import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/eazychange-en";

export const metadata = pageMetadata({ path: "/eazychange-en", title: "Eazychange" });

export default function Page() {
  return (
    <SitePage lang="en" shell={shell}>
      <Body />
    </SitePage>
  );
}
