import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/pot-en";

export const metadata = pageMetadata({ path: "/pot-en", title: "POT" });

export default function Page() {
  return (
    <SitePage lang="en" shell={shell}>
      <Body />
    </SitePage>
  );
}
