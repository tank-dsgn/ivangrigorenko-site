import { pageMetadata } from "@/lib/metadata";
import SitePage from "@/components/SitePage";
import Body, { shell } from "@/components/generated/vv-en";

export const metadata = pageMetadata({ path: "/vv-en", title: "Design system" });

export default function Page() {
  return (
    <SitePage lang="en" shell={shell}>
      <Body />
    </SitePage>
  );
}
