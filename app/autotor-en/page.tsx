import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/autotor-en";

export const metadata = pageMetadata({ path: "/autotor-en", title: "autotor.pl" });

export default function Page() {
  return (
    <SitePage lang="en" shell={shell}>
      <Body />
    </SitePage>
  );
}
